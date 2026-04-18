import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  product = signal<any>(null);
  allProducts: any[] = [];
  relatedProducts: any[] = [];

  prevProductId: string | null = null;
  nextProductId: string | null = null;

  qty: number = 1;
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductData(id);
      }
    });
  }

  loadProductData(id: string) {
    this.isLoading.set(true);
    this.product.set(null);

    // 1. Fetch main product and show immediately
    this.storeService.getProductById(id).subscribe({
      next: (res: any) => {
        // استخراج الكائن من خاصية data كما يظهر في Postman
        const p = res.data;

        if (!p) {
          this.isLoading.set(false);
          return;
        }

        this.product.set({
          id: p._id,
          name: p.name,
          desc: p.description,
          cat: p.category?.name || 'أخرى',
          price: p.finalPrice || p.price, // استخدم finalPrice لو موجود
          oldPrice: p.price > p.finalPrice ? p.price : null,
          rating: p.rating || (4 + Math.random()),
          reviews: p.reviews || Math.floor(Math.random() * 100) + 10,
          emoji: '🌿',
          // تأكد من مسار الصور لو عندك مصفوفة images
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : null,
          color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          isBestSeller: p.stock < 10 && p.stock > 0
        });

        this.isLoading.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.fetchRelatedData(id);
      },
      error: (err) => {
        console.error('Error fetching product:', err);
        this.isLoading.set(false);
        this.alertService.show('حدث خطأ أثناء تحميل المنتج.', 'error');
      }
    });
  }

  fetchRelatedData(id: string) {
    this.storeService.getProducts().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (Array.isArray(data)) {
          this.allProducts = data.map((item: any) => ({
            id: item._id,
            name: item.name,
            desc: item.description,
            price: item.price,
            cat: item.category?.name || item.category || 'أخرى',
            rating: 4 + Math.random(),
            reviews: Math.floor(Math.random() * 100) + 10,
            emoji: '🌿',
            imageUrl: item.images && item.images.length > 0 ? item.images[0] : null,
            color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
          }));

          const index = this.allProducts.findIndex(item => item.id === id);
          if (index !== -1) {
            this.prevProductId = index > 0 ? this.allProducts[index - 1].id : null;
            this.nextProductId = index < this.allProducts.length - 1 ? this.allProducts[index + 1].id : null;
            this.relatedProducts = this.allProducts
              .filter(item => item.id !== id && (item.cat === (this.product()?.cat || '') || true))
              .slice(0, 4);
          }
        }
      }
    });
  }

  addToCart() {
    if (!this.authService.currentUser()) {
      this.alertService.show('الرجاء تسجيل الدخول أولاً لإضافة منتجات للسلة', 'info');
      this.router.navigate(['/login']);
      return;
    }

    if (this.product()) {
      this.storeService.addToCart(this.product().id, this.qty, this.product().price).subscribe({
        next: () => {
          this.alertService.show('تمت الإضافة إلى السلة بنجاح! 🛒', 'success');
          this.storeService.isCartOpen.set(true);
        },
        error: () => this.alertService.show('عذراً، حدث خطأ أثناء الإضافة للسلة', 'error')
      });
    }
  }

  getStars(rating: number) {
    const r = Math.round(rating || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  getImageUrl(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseRoot = environment.apiUrl.replace('/api', '');
    return `${baseRoot}/${path}`;
  }
}
