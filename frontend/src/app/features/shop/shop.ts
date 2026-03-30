import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/interfaces';

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

  products = signal<Product[]>([]);
  categories = signal<any[]>([]);



  ngOnInit() {
    this.storeService.getProducts().subscribe((res: any) => {
      const data = res.data || res;
      this.products.set(data);
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
      const catId = (p.category as any)?._id || p.category;
      const matchesFilter = filter === 'all' || catId === filter;
      const matchesPrice = price === 0 || p.price <= price;
      return matchesFilter && matchesPrice;
    });
  });



  setFilter(cat: string) {
    this.activeFilter.set(cat);
  }



  addToCart(product: Product) {
    if (!this.authService.currentUser()) {
      alert('الرجاء تسجيل الدخول أولاً لإضافة منتجات للسلة');
      this.router.navigate(['/login']);
      return;
    }

    const priceToAdd = product.finalPrice ? product.finalPrice : product.price;

    this.storeService.addToCart(product._id, 1, priceToAdd).subscribe({
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
