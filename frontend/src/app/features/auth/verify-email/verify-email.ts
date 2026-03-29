import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmailComponent implements OnInit {
  verifyData = {
    email: '',
    code: ''
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  message: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Try to get email from query params if available
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.verifyData.email = emailParam;
    }
  }

  onVerify() {
    if (!this.verifyData.email || !this.verifyData.code) {
      this.status = 'error';
      this.message = 'يرجى إدخال البريد الإلكتروني ورمز التحقق';
      return;
    }

    this.status = 'loading';
    this.authService.verifyEmail(this.verifyData).subscribe({
      next: (res: any) => {
        this.status = 'success';
        this.message = 'تم التحقق من حسابك بنجاح! يمكنك الآن تسجيل الدخول';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.status = 'error';
        this.message = 'رمز التحقق خاطئ أو منتهي الصلاحية، حاول مرة أخرى';
        console.error('Verification error:', err);
      }
    });
  }
}
