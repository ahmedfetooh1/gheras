import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../core/services/store.service';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';

import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './checkout.html',
    styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
    public storeService = inject(StoreService);
    private alertService = inject(AlertService);
    private router = inject(Router);

    checkoutStep = signal<string>('shipping');
    
    phone = signal<string>('');
    city = signal<string>('');
    street = signal<string>('');
    paymentMethod = signal<string>('cash');
    
    orderLoading = signal<boolean>(false);

    ngOnInit() {
        // Redirect if cart is empty
        if (this.storeService.cartItems().length === 0) {
            this.storeService.getCart().subscribe(cart => {
                if (!cart || (cart.items && cart.items.length === 0)) {
                    this.alertService.show('سلة التسوق فارغة', 'info');
                    this.router.navigate(['/shop']);
                }
            });
        }
    }

    setStep(step: string) {
        this.checkoutStep.set(step);
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

        console.log('Placing order with data:', orderData);

        this.storeService.checkout(orderData).subscribe({
            next: (res: any) => {
                console.log('Order response:', res);
                const order = res.data || res;
                if (this.paymentMethod() === 'card') {
                    this.initiateCardPayment(order._id);
                } else {
                    this.alertService.show('تم تسجيل طلبك بنجاح! شكراً لتعاملك معنا ✅');
                    this.storeService.clearCart().subscribe();
                    setTimeout(() => this.router.navigate(['/shop']), 2000);
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
        this.router.navigate(['/shop/checkout/payment', orderId]);
        this.orderLoading.set(false);
    }

    getImageUrl(path: string) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseRoot = environment.apiUrl.replace('/api', '');
        return `${baseRoot}/${path}`;
    }
}
