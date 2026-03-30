import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './cart.html',
    styleUrl: './cart.css',
})
export class CartComponent {
    public storeService = inject(StoreService);
    private sanitizer = inject(DomSanitizer);
    private alertService = inject(AlertService);

    // Checkout Steps: 'cart' | 'shipping' | 'payment-selection' | 'processing' | 'iframe'
    checkoutStep = signal<string>('cart');
    
    // Shipping Data
    phone = signal<string>('');
    city = signal<string>('');
    street = signal<string>('');
    paymentMethod = signal<string>('cash'); // 'cash' | 'card'
    
    // Payment Iframe
    iframeUrl = signal<SafeResourceUrl | null>(null);
    orderLoading = signal<boolean>(false);

    toggleCart() {
        this.storeService.toggleCart();
        if (!this.storeService.isCartOpen()) {
            this.checkoutStep.set('cart');
            this.iframeUrl.set(null);
        }
    }

    setStep(step: string) {
        this.checkoutStep.set(step);
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
        this.storeService.clearCart().subscribe(() => {
            this.alertService.show('تم إفراغ العربة بنجاح');
        });
    }

    proceedToCheckout() {
        if (this.storeService.cartItems().length === 0) return;
        this.checkoutStep.set('shipping');
    }

    placeOrder() {
        if (!this.phone() || !this.city() || !this.street()) {
            this.alertService.show('الرجاء إكمال كافة بيانات الشحن', 'error');
            return;
        }

        this.orderLoading.set(true);
        const orderData = {
            phone: this.phone(),
            address: {
                city: this.city(),
                street: this.street()
            },
            paymentMethod: this.paymentMethod()
        };

        this.storeService.checkout(orderData).subscribe({
            next: (res: any) => {
                const order = res.data || res;
                if (this.paymentMethod() === 'card') {
                    this.initiateCardPayment(order._id);
                } else {
                    this.alertService.show('تم تسجيل طلبك بنجاح! شكراً لتعاملك معنا ✅');
                    this.storeService.clearCart().subscribe();
                    this.checkoutStep.set('cart');
                    setTimeout(() => this.storeService.isCartOpen.set(false), 2000);
                    this.orderLoading.set(false);
                }
            },
            error: (err: any) => {
                console.error('Checkout error:', err);
                const msg = err.error?.message || err.error?.error || 'حدث خطأ أثناء إتمام الطلب';
                this.alertService.show(msg, 'error');
                this.orderLoading.set(false);
            }
        });
    }

    initiateCardPayment(orderId: string) {
        this.storeService.createPaymentForOrder(orderId).subscribe({
            next: (res: any) => {
                if (res.success && res.iframeUrl) {
                    this.iframeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(res.iframeUrl));
                    this.checkoutStep.set('iframe');
                } else {
                    this.alertService.show('عذراً، لم نتمكن من جلب رابط الدفع', 'error');
                }
                this.orderLoading.set(false);
            },
            error: (err: any) => {
                console.error('Payment error:', err);
                this.alertService.show('فشل في بدء عملية الدفع الإلكتروني', 'error');
                this.orderLoading.set(false);
            }
        });
    }

    getImageUrl(path: string) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:3000/${path}`;
    }
}
