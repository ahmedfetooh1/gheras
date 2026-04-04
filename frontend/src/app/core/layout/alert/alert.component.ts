import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private subscription?: Subscription;

  activeAlerts: (Alert & { id: number })[] = [];
  private nextId = 0;

  ngOnInit() {
    this.subscription = this.alertService.alerts$.subscribe(alert => {
      const id = this.nextId++;
      const newAlert = { ...alert, id };
      this.activeAlerts.push(newAlert);

      // Auto-remove after 5 seconds
      setTimeout(() => this.removeAlert(id), 5000);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  removeAlert(id: number) {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  }
}
