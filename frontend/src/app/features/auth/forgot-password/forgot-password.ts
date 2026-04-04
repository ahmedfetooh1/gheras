import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  step: 1 | 2 = 1;
  email: string = '';

  verificationCode: string = '';
  newPassword: string = '';

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage: string = '';
  successMessage: string = '';

  onSendCode() {
    if (!this.email) {
      this.status = 'error';
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني';
      return;
    }

    this.status = 'loading';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.authService.forgetPassword(this.email).subscribe({
      next: (res: any) => {
        this.status = 'idle';
        this.successMessage = 'تم إرسال الكود إلى بريدك الإلكتروني بنجاح.';
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'تعذر إرسال الكود. تأكد من البريد الإلكتروني';
        console.error('Forget password error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onResetPassword() {
    if (!this.verificationCode || !this.newPassword) {
      this.status = 'error';
      this.errorMessage = 'يرجى إدخال الكود وكلمة المرور الجديدة';
      this.successMessage = '';
      return;
    }

    this.status = 'loading';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const payload = {
      code: this.verificationCode,
      newPassword: this.newPassword
    };

    this.authService.verifyPassword(payload).subscribe({
      next: (res: any) => {
        this.status = 'success';
        this.successMessage = 'تم تغيير كلمة المرور بنجاح!';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'الكود غير صحيح أو منتهي الصلاحية';
        console.error('Verify password error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
