import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

interface LocalProduct {
  id: string;
  name: string;
  desc: string;
  catId: string;
  catName: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  emoji: string;
  color: string;
  isBestSeller?: boolean;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop implements OnInit {
  activeFilter = signal<string>('all');
  maxPrice = signal<number>(10000);
  sortOption = signal<string>('latest');

  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  products = signal<LocalProduct[]>([]);
  categories = signal<any[]>([]);

  ngOnInit() {
    this.storeService.getProducts().subscribe((res: any) => {
      const data = res.data || res;
      this.products.set(data.map((p: any) => ({
        id: p._id,
        name: p.name,
        desc: p.description || '',
        catId: p.category?._id || p.category,
        catName: p.category?.name || 'أخرى',
        price: p.price,
        rating: 4 + Math.random(),
        reviews: Math.floor(Math.random() * 100) + 10,
        emoji: '🌿',
        color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        isBestSeller: p.stock < 10 && p.stock > 0
      })));
    });

    this.storeService.getCategories().subscribe((res: any) => {
      this.categories.set(res.data || res);
    });
  }

  filteredProducts = computed(() => {
    let list = [...this.products()];
    const filter = this.activeFilter();
    const priceLimit = this.maxPrice();
    const sort = this.sortOption();

    // Filtering
    list = list.filter(p => {
      const matchesFilter = filter === 'all' || p.catId === filter;
      const matchesPrice = p.price <= priceLimit;
      return matchesFilter && matchesPrice;
    });

    // Sorting
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'top-rated') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      // latest - default (assuming order in list)
    }

    return list;
  });

  setFilter(cat: string) {
    this.activeFilter.set(cat);
  }

  onSortChange(event: any) {
    this.sortOption.set(event.target.value);
  }

  addToCart(product: LocalProduct) {
    if (!this.authService.currentUser()) {
      this.alertService.show('الرجاء تسجيل الدخول أولاً لإضافة منتجات للسلة', 'info');
      this.router.navigate(['/login']);
      return;
    }

    this.storeService.addToCart(product.id, 1, product.price).subscribe({
      next: () => {
        this.storeService.isCartOpen.set(true);
      },
      error: () => this.alertService.show('عذراً، حدث خطأ أثناء الإضافة للسلة', 'error')
    });
  }

  getStars(rating: number) {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
