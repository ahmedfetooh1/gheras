import { Component } from '@angular/core';  
import { AuthService } from '../../../core/services/auth.service'; 
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  user = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.user.email || !this.user.password || !this.user.firstName || !this.user.username) {
      this.status = 'error';
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    this.status = 'loading';
    this.errorMessage = '';

    this.authService.signup(this.user).subscribe({
      next: (res: any) => {
        this.status = 'success';
        console.log('Registered successfully', res);
        // Redirect after a short delay
        setTimeout(() => {
          this.router.navigate(['/verify-email'], { 
            queryParams: { email: this.user.email } 
          });
        }, 1500);
      },
      error: (err: any) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً';
        console.error('Registration error:', err);
      }
    });
  }
}

