import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts$ | async"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.dismiss(toast.id)"
      >
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '⚡' : 'ℹ️' }}
        </span>
        <span class="toast-text">{{ toast.text }}</span>
        <button class="toast-close" (click)="toastService.dismiss(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 32px;
      right: 32px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: calc(100vw - 64px);
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-radius: var(--radius-lg);
      color: #ffffff;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
      font-size: 0.95rem;
      font-weight: 500;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      cursor: pointer;
      pointer-events: auto;
      backdrop-filter: blur(12px);
    }
    .toast-success {
      border: 1px solid #10b981;
      background: #064e3b;
    }
    .toast-error {
      border: 1px solid #f43f5e;
      background: #881337;
    }
    .toast-warning {
      border: 1px solid #f59e0b;
      background: #78350f;
    }
    .toast-info {
      border: 1px solid #3b82f6;
      background: #1e3a8a;
    }
    .toast-text {
      flex: 1;
      font-weight: 500;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9rem;
    }
    .toast-close:hover {
      color: #ffffff;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
