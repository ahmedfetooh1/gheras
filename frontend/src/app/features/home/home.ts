import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  authService = inject(AuthService);

  get dashboardLink(): string {
    const user = this.authService.currentUser();
    if (!user) return '/login';
    return user.role === 'admin' ? '/dashboard/admin' : '/dashboard';
  }
}
