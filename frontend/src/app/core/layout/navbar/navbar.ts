import { CommonModule } from '@angular/common';
import { Component, inject, computed, ViewEncapsulation, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit {
  public authService = inject(AuthService);
  public storeService = inject(StoreService);
  private router = inject(Router);

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.storeService.getCart().subscribe();
    }
  }

  handleCartClick() {
    if (this.authService.currentUser()) {
      this.storeService.toggleCart();
    } else {
      this.router.navigate(['/login']);
    }
  }

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