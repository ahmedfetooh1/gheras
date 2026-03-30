import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertState {
  message: string;
  type: AlertType;
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  state = signal<AlertState>({
    message: '',
    type: 'success',
    show: false
  });

  private timeout: any;

  show(message: string, type: AlertType = 'success', duration: number = 4000) {
    // Clear existing timeout if any
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.state.set({ message, type, show: true });

    this.timeout = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.state.update(s => ({ ...s, show: false }));
  }
}
