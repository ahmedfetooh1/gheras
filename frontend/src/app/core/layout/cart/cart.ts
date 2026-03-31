import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.html',
    styleUrl: './cart.css',
})
export class CartComponent {
    public storeService = inject(StoreService);
    private router = inject(Router);

    toggleCart() {
        this.storeService.toggleCart();
    }

    proceedToCheckout() {
        this.storeService.toggleCart();
        this.router.navigate(['/shop/checkout']);
    }

    updateQty(item: any, delta: number) {
        const productId = item.product?._id;
        const currentPrice = item.product?.finalPrice || item.product?.price || item.price;
        const newQty = item.quantity + delta;
        if (newQty < 1) {
            this.removeItem(item);
        } else {
            this.storeService.updateCartItem(productId, newQty, currentPrice).subscribe();
        }
    }

    removeItem(item: any) {
        const productId = item.product?._id;
        this.storeService.removeCartItem(productId).subscribe();
    }

    clearCart() {
        if (confirm('هل تريد فعلاً إفراغ عربة التسوق؟')) {
            this.storeService.clearCart().subscribe();
        }
    }

    getImageUrl(path: string) {
        return `http://localhost:3000/${path}`;
    }
}
