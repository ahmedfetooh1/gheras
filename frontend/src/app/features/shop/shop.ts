import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  id: string;
  name: string;
  desc: string;
  cat: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  activeFilter = signal<string>('all');
  maxPrice: number = 500;
  isCartOpen = signal<boolean>(false);

  products: Product[] = [
    { id: 'npk', name: 'سماد NPK المتكامل', desc: 'سماد متوازن للنمو العام — مناسب للطماطم والخضروات', cat: 'أسمدة', price: 65, oldPrice: 80, rating: 5, reviews: 128, emoji: '🧪', color: 'linear-gradient(135deg,#fffbeb,#fef3c7)', isBestSeller: true },
    { id: 'organic', name: 'سماد الأعشاب العضوي', desc: '100% طبيعي من مخلفات النباتات — آمن للاستخدام المنزلي', cat: 'أسمدة', price: 45, rating: 4, reviews: 64, emoji: '🍂', color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    { id: 'flower', name: 'سماد الزهور السائل', desc: 'يعزز التزهير ويمنح الألوان حيوية — للورد والياسمين', cat: 'أسمدة', price: 55, rating: 5, reviews: 93, emoji: '🌸', color: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' },
    { id: 'cactus-soil', name: 'تربة رملية للصبار', desc: 'خلطة متخصصة للكاكتوس والصبار — صرف ممتاز للمياه', cat: 'تربة', price: 35, rating: 4, reviews: 47, emoji: '🏜️', color: 'linear-gradient(135deg,#faf5eb,#e7d5a8)' },
    { id: 'veg-soil', name: 'تربة خضروات غنية', desc: 'خلطة عضوية غنية بالمغذيات — للطماطم والفلفل والخيار', cat: 'تربة', price: 40, oldPrice: 50, rating: 5, reviews: 82, emoji: '🪵', color: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' },
    { id: 'seeds', name: 'بذور طماطم هجين', desc: 'إنتاجية عالية — 20 بذرة في العبوة الواحدة', cat: 'بذور', price: 25, rating: 4, reviews: 55, emoji: '🌱', color: 'linear-gradient(135deg,#fff5f5,#fee2e2)' },
    { id: 'spray', name: 'بخاخ نباتات 1 لتر', desc: 'بخاخ ضباب ناعم للأوراق — مقاوم للصدأ', cat: 'أدوات', price: 30, rating: 5, reviews: 110, emoji: '🧴', color: 'linear-gradient(135deg,#f0f9ff,#bae6fd)' },
    { id: 'pesticide', name: 'مبيد الحشرات الدقيقية', desc: 'آمن للاستخدام المنزلي — يقضي على البق والحشرات الدقيقة', cat: 'علاجات', price: 70, rating: 4, reviews: 38, emoji: '🛡️', color: 'linear-gradient(135deg,#fdf4ff,#e9d5ff)' }
  ];

  cartItems: any[] = [
    { id: 'npk', name: 'سماد NPK المتكامل', price: 65, qty: 1, emoji: '🧪' },
    { id: 'veg-soil', name: 'تربة خضروات غنية', price: 40, qty: 1, emoji: '🪵' }
  ];

  get filteredProducts() {
    return this.products.filter(p => {
      const matchesFilter = this.activeFilter() === 'all' || p.cat === this.activeFilter();
      const matchesPrice = p.price <= this.maxPrice;
      return matchesFilter && matchesPrice;
    });
  }

  get cartTotal() {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  setFilter(cat: string) {
    this.activeFilter.set(cat);
  }

  toggleCart() {
    this.isCartOpen.set(!this.isCartOpen());
  }

  addToCart(product: Product) {
    const existing = this.cartItems.find(item => item.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cartItems.push({ id: product.id, name: product.name, price: product.price, qty: 1, emoji: product.emoji });
    }
    this.toggleCart();
  }

  updateQty(itemId: string, delta: number) {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.cartItems = this.cartItems.filter(i => i.id !== itemId);
      }
    }
  }

  getStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
