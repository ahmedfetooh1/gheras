import { CommonModule } from '@angular/common';
import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent {
  public authService = inject(AuthService); // Public for HTML access
  private router = inject(Router);

  isMenuOpen = false;

  // Re-define signals to be even more reactive
  isLoggedIn = computed(() => !!this.authService.currentUser());
  userName = computed(() => {
    const user = this.authService.currentUser();
    console.log('Navbar: checking user signal:', user);
    return user?.firstName || user?.username || user?.name || '';
  });

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    console.log('Navbar: Logging out...');
    this.authService.logout();
    this.isMenuOpen = false;
    this.router.navigate(['/']);
  }
}