import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StoreService } from '../../../core/services/store.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  public storeService = inject(StoreService);
  private alertService = inject(AlertService);

  orderId = signal<string | null>(null);
  iframeUrl = signal<SafeResourceUrl | null>(null);
  loading = signal<boolean>(true);
  paymentStatus = signal<'pending' | 'success' | 'failed' | null>(null);

  ngOnInit() {
    // First, check if there's a success/failure in query params (from redirect)
    this.route.queryParams.subscribe(queryParams => {
      const success = queryParams['success'];
      const error = queryParams['error'];
      const orderStatus = queryParams['orderStatus'];
      
      if (success === 'true' || success === true) {
        this.paymentStatus.set('success');
        this.loading.set(false);
        return;
      }
      
      if (success === 'false' || error) {
        this.paymentStatus.set('failed');
        this.loading.set(false);
        return;
      }
    });

    // Then check route params for order ID to fetch payment iframe
    this.route.params.subscribe(params => {
      const id = params['orderId'];
      
      if (id && !this.paymentStatus()) {
        this.orderId.set(id);
        this.fetchPaymentUrl(id);
      } else if (!id && !this.paymentStatus()) {
        this.alertService.show('طلب غير صالح', 'error');
        this.router.navigate(['/shop']);
      }
    });
  }

  fetchPaymentUrl(orderId: string) {
    this.loading.set(true);
    this.storeService.createPaymentForOrder(orderId).subscribe({
      next: (res: any) => {
        if (res.success && res.iframeUrl) {
          this.iframeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(res.iframeUrl));
        } else {
          this.alertService.show('عذراً، لم نتمكن من جلب رابط الدفع', 'error');
          this.router.navigate(['/shop/checkout']);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Payment error:', err);
        this.alertService.show('فشل في بدء عملية الدفع الإلكتروني', 'error');
        this.loading.set(false);
        this.router.navigate(['/shop/checkout']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/shop/checkout']);
  }

  retryPayment() {
    const orderId = this.orderId();
    if (orderId) {
      this.paymentStatus.set(null);
      this.fetchPaymentUrl(orderId);
    }
  }

  goToOrders() {
    this.router.navigate(['/dashboard']);
  }

  goToShop() {
    this.router.navigate(['/shop']);
  }
}
