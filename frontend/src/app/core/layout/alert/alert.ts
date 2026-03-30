import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-global-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alertService.state().show) {
    <div class="toast-container" [class.toast-active]="alertService.state().show" [class]="alertService.state().type">
      <div class="toast-content">
        <span class="toast-icon">
          @if (alertService.state().type === 'success') { ✅ }
          @else if (alertService.state().type === 'error') { ❌ }
          @else if (alertService.state().type === 'warning') { ⚠️ }
          @else { ℹ️ }
        </span>
        <div class="toast-message">{{ alertService.state().message }}</div>
        <button class="toast-close" (click)="alertService.hide()">✕</button>
      </div>
      <div class="toast-progress" [style.animation-duration]="'4s'"></div>
    </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 99999;
      background: white;
      border-radius: 12px;
      padding: 1rem 1.2rem;
      min-width: 320px;
      max-width: 450px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      direction: rtl;
      overflow: hidden;
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .toast-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      font-size: 0.92rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.5;
    }

    .toast-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.2rem;
      transition: color 0.2s;
    }

    .toast-close:hover {
      color: #475569;
    }

    /* Types */
    .success { border-right: 5px solid #10b981; }
    .error { border-right: 5px solid #ef4444; }
    .warning { border-right: 5px solid #f59e0b; }
    .info { border-right: 5px solid #3b82f6; }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(0,0,0,0.05);
      width: 100%;
    }

    .success .toast-progress { background: #10b981; opacity: 0.2; }
    .error .toast-progress { background: #ef4444; opacity: 0.2; }
    
    .toast-progress {
      animation: progressLinear 4s linear forwards;
    }

    @keyframes toastSlideIn {
      from { transform: translateX(50px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes progressLinear {
      from { width: 100%; }
      to { width: 0%; }
    }

    @media (max-width: 480px) {
      .toast-container {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        min-width: auto;
      }
    }
  `]
})
export class GlobalAlertComponent {
  public alertService = inject(AlertService);
}
