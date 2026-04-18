import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Product, Category, Cart, Order } from '../models/interfaces';
import { AuthService } from './auth.service';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl;

  // Global Cart State
  isCartOpen = signal(false);
  cartItems = signal<any[]>([]);
  cartTotalAmount = signal<number>(0);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/product`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/product/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/category`);
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/cart`).pipe(
      tap((res: any) => {
        const cart = res.data || res;
        this.cartItems.set(cart.items || []);
        this.cartTotalAmount.set(cart.totalPrice || 0);
      })
    );
  }

  addToCart(productId: string, quantity: number, price?: number): Observable<any> {
    const body: any = { productId, quantity };
    if (price !== undefined) body.price = price;

    return this.http.post(`${this.baseUrl}/cart`, body).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // Update specific item quantity
  updateCartItem(productId: string, quantity: number, price?: number): Observable<any> {
    const body: any = { productId, quantity };
    if (price !== undefined) body.price = price;

    return this.http.put(`${this.baseUrl}/cart/${productId}`, body).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // Remove specific item
  removeCartItem(productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/${productId}`).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // Clear entire cart
  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart`).pipe(
      tap(() => {
        this.cartItems.set([]);
        this.isCartOpen.set(false);
      })
    );
  }

  toggleCart() {
    this.isCartOpen.set(!this.isCartOpen());
  }

  checkout(orderData: any): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, orderData);
  }

  createPayment(amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/create-payment`, { amount });
  }

  createPaymentForOrder(orderId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/create-payment-for-order`, { orderId });
  }
}
