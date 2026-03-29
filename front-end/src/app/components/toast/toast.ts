import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div class="toast"
        *ngFor="let t of toast.toasts()"
        [class.toast--success]="t.type === 'success'"
        [class.toast--error]="t.type === 'error'"
        [class.toast--info]="t.type === 'info'">
        <span class="toast__icon">
          {{ t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️' }}
        </span>
        <span class="toast__message">{{ t.message }}</span>
        <button class="toast__close" (click)="toast.dismiss(t.id)">×</button>
      </div>
    </div>
  `,
  styleUrl: './toast.scss'
})
export class ToastComponent {
  toast = inject(ToastService);
}