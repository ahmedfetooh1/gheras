import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = {
    email: '',
    password: ''
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        this.status = 'loading';
        localStorage.setItem('token', token);

        // تحديث حالة المستخدم في الـ service
        this.authService.loadUserFromStorage();

        // التوجيه للداشبورد (التنقل بالـ router هيمسح الـ query params من الـ URL)
        const user = this.authService.currentUser();
        if (user) {
          this.redirectToDashboard(user.role);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else if (error) {
        this.status = 'error';
        this.errorMessage = error;
      }
    });

    // لو المستخدم موجود بالفعل (بعد الـ reload مثلاً) ولسه في صفحة الـ login، وديه الداشبورد
    setTimeout(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.redirectToDashboard(user.role);
      }
    }, 500);
  }

  private redirectToDashboard(role?: string) {
    const r = role?.toLowerCase();
    if (r === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else if (r === 'specialist') {
      this.router.navigate(['/dashboard/specialist']);
    } else if (r === 'premium') {
      this.router.navigate(['/dashboard/premium']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.status = 'error';
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
      return;
    }

    this.status = 'loading';
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res: any) => {
        this.status = 'success';
        console.log('Logged in successfully', res);

        const user = this.authService.currentUser();
        this.redirectToDashboard(user?.role);
      },
      error: (err: any) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        console.error('Login error:', err);
      }
    });
  }
}
