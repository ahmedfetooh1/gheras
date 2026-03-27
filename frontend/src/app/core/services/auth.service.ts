import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  name?: string;
  password?: string;
  lastName?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/users';

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // ================= LOAD USER =================
  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (userJson && userJson !== 'undefined' && userJson !== 'null') {
      try {
        const user = JSON.parse(userJson);

        // تأكد إن فيه role، لو لا جيبه من التوكين
        if (!user.role && token) {
          const decoded = this.decodeToken(token);
          if (decoded?.role) {
            user.role = decoded.role;
          }
        }

        this.currentUser.set(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    } else if (token) {
      const decodedUser = this.decodeToken(token);
      if (decodedUser) {
        this.currentUser.set(decodedUser);
      }
    }
  }

  // ================= DECODE TOKEN =================
  private decodeToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);

      return {
        id: decoded.id || decoded.sub || decoded._id,
        username: decoded.username || decoded.name || decoded.email,
        email: decoded.email,
        firstName: decoded.firstName || decoded.username || decoded.name,
        role: decoded.role || decoded.roles || decoded.userRole // 👈 مرن
      };
    } catch (e) {
      return null;
    }
  }

  // ================= SIGNUP =================
  signup(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, user);
  }

  verifyEmail(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, data);
  }

  // ================= LOGIN =================
  login(credentials: Partial<User>): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        // 1. Save token
        const token = res.token || res.data?.token || res.accessToken;
        if (token) {
          localStorage.setItem('token', token);
        }

        // 2. Get user from response
        let user = null;

        if (res.user) {
          user = res.user;
        } else if (res.data?.user) {
          user = res.data.user;
        } else if (res.data && (res.data.email || res.data.username)) {
          user = res.data;
        } else if (res.email || res.username) {
          user = res;
        }

        // 3. Decode token ALWAYS
        const decodedUser = token ? this.decodeToken(token) : null;

        // 4. لو مفيش user خالص → خد من التوكين
        if (!user && decodedUser) {
          user = decodedUser;
        }

        // 5. Merge role لو مش موجود
        if (user && !user.role && decodedUser?.role) {
          user.role = decodedUser.role;
        }

        // 6. Save user
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);

          console.log('👤 Final User:', user);
        } else {
          console.error('❌ No user data found in response');
        }
      })
    );
  }

  // ================= LOGOUT =================
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }
}