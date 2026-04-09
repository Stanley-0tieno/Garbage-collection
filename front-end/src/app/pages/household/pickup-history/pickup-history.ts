import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PickupRequest, PickupStatus } from '../../../models/pickup.model';

type FilterStatus = 'ALL' | PickupStatus;

@Component({
  selector: 'app-pickup-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pickup-history.html',
  styleUrl: './pickup-history.scss'
})
export class PickupHistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private pickups = inject(PickupService);

  loading = signal(true);
  pickupList = signal<PickupRequest[]>([]);
  activeFilter = signal<FilterStatus>('ALL');

  payingId = signal<string | null>(null);
  paymentMethod = signal<'CASH' | 'MPESA'>('CASH');
  processingPayment = signal(false);

  readonly filters: { value: FilterStatus; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const list = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return f === 'ALL' ? list : list.filter(p => p.status === f);
  });

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id ?? '';
    this.pickups.getMyPickups(userId).subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setFilter(f: FilterStatus) { this.activeFilter.set(f); }

  statusClass(status: string): string {
    return { PENDING: 'badge--pending', ASSIGNED: 'badge--assigned', COMPLETED: 'badge--completed', CANCELLED: 'badge--cancelled' }[status] ?? '';
  }

  wasteLabel(type: string): string {
    return { general: 'General Waste', recyclable: 'Recyclable', organic: 'Organic', electronic: 'Electronic', hazardous: 'Hazardous' }[type] ?? type;
  }

  wasteIcon(type: string): string {
    return { general: '🗑️', recyclable: '♻️', organic: '🌿', electronic: '💻', hazardous: '⚠️' }[type] ?? '📦';
  }

  initPayment(id: string): void {
    const pickup = this.pickupList().find(p => p.id === id);
    if (!pickup) return;
    this.payingId.set(id);
    this.paymentMethod.set('CASH');
  }

  setPaymentMethod(method: 'CASH' | 'MPESA'): void {
    this.paymentMethod.set(method);
  }

  confirmPayment(): void {
    const id = this.payingId();
    if (!id) return;
    this.processingPayment.set(true);

    // Simulate payment delay
    const delay = this.paymentMethod() === 'MPESA' ? 1500 : 500;

    setTimeout(() => {
      this.pickups.updateStatus(id, 'COMPLETED').subscribe({
        next: updated => {
          updated.paymentStatus = 'PAID';
          this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.payingId.set(null);
          this.processingPayment.set(false);
          alert('Pickup finalized. Thank you for your payment!');
        },
        error: () => {
          alert('Failed to complete pickup.');
          this.processingPayment.set(false);
        }
      });
    }, delay);
  }

  cancelPayment(): void {
    this.payingId.set(null);
  }
}