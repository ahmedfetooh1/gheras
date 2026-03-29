import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { Navbar } from './core/layout/navbar/navbar';
import { Footer } from './core/layout/footer/footer';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './core/layout/navbar/navbar';
import { CartComponent } from './core/layout/cart/cart';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, Footer, CartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
