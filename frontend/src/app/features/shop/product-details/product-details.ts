import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

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

  product: any;
  allProducts: any[] = [];
  relatedProducts: any[] = [];

  prevProductId: string | null = null;
  nextProductId: string | null = null;

  qty: number = 1;
  isLoading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductData(id);
      }
    });
  }

  loadProductData(id: string) {
    this.isLoading = true;
    this.product = null;

    // 1. Fetch main product and show immediately
    this.storeService.getProductById(id).subscribe({
      next: (res: any) => {
        // Robust data extraction
        let p = res.data || res;
        if (Array.isArray(p)) p = p[0];

        if (!p || typeof p !== 'object') {
          console.warn('Product data not found for ID:', id);
          this.isLoading = false;
          return;
        }

        this.product = {
          id: p._id || id,
          name: p.name || 'منتج جديد',
          desc: p.description || p.desc || '',
          cat: p.category?.name || p.category || 'أخرى',
          price: p.price || 0,
          oldPrice: p.oldPrice || p.oldprice,
          rating: p.rating || (4 + Math.random()),
          reviews: p.reviews || Math.floor(Math.random() * 100) + 10,
          emoji: '🌿',
          color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          isBestSeller: (p.stock || 0) < 10 && (p.stock || 0) > 0,
          imageUrl: p.imageUrl
        };

        this.isLoading = false; // Hide "Loading..." now
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 2. Fetch all products in background for navigation and related
        this.fetchRelatedData(id);
      },
      error: (err) => {
        console.error('Error fetching product:', err);
        this.isLoading = false;
        alert('حدث خطأ أثناء تحميل المنتج.');
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
            color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
          }));

          const index = this.allProducts.findIndex(item => item.id === id);
          if (index !== -1) {
            this.prevProductId = index > 0 ? this.allProducts[index - 1].id : null;
            this.nextProductId = index < this.allProducts.length - 1 ? this.allProducts[index + 1].id : null;
            this.relatedProducts = this.allProducts
              .filter(item => item.id !== id && (item.cat === (this.product?.cat || '') || true))
              .slice(0, 4);
          }
        }
      }
    });
  }

  addToCart() {
    if (!this.authService.currentUser()) {
      alert('الرجاء تسجيل الدخول أولاً لإضافة منتجات للسلة');
      this.router.navigate(['/login']);
      return;
    }

    if (this.product) {
      this.storeService.addToCart(this.product.id, this.qty).subscribe({
        next: () => alert('تمت الإضافة إلى السلة بنجاح! 🛒'),
        error: () => alert('عذراً، حدث خطأ أثناء الإضافة للسلة')
      });
    }
  }

  getStars(rating: number) {
    const r = Math.round(rating || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
