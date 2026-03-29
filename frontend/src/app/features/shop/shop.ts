import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';

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
  maxPrice: number = 0;


  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

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
    const list = this.products();
    const filter = this.activeFilter();
    const price = this.maxPrice;
    return list.filter(p => {
      const matchesFilter = filter === 'all' || p.catId === filter;
      const matchesPrice = price === 0 || p.price <= price;
      return matchesFilter && matchesPrice;
    });
  });



  setFilter(cat: string) {
    this.activeFilter.set(cat);
  }



  addToCart(product: LocalProduct) {
    if (!this.authService.currentUser()) {
      alert('الرجاء تسجيل الدخول أولاً لإضافة منتجات للسلة');
      this.router.navigate(['/login']);
      return;
    }

    this.storeService.addToCart(product.id, 1, product.price).subscribe({
      next: () => {
        this.storeService.isCartOpen.set(true);
      },
      error: () => alert('عذراً، حدث خطأ أثناء الإضافة للسلة')
    });
  }



  getStars(rating: number) {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
