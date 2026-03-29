import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

  credentials = {
    email: '',
    password: ''
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage: string = '';

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

        // جلب المستخدم لتقرير الوجهة المناسبة بناءً على دوره
        const user = this.authService.currentUser();
        const role = user?.role?.toLowerCase();

        if (role === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (role === 'specialist') {
          this.router.navigate(['/dashboard/specialist']);
        } else if (role === 'premium') {
          this.router.navigate(['/dashboard/premium']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        console.error('Login error:', err);
      }
    });
  }
}
