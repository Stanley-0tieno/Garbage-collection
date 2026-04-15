import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PaymentService } from '../../../services/api/payment.service';
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
  private payments = inject(PaymentService);

  loading = signal(true);
  pickupList = signal<PickupRequest[]>([]);
  activeFilter = signal<FilterStatus>('ALL');

  payingId = signal<string | null>(null);
  paymentMethod = signal<'CASH' | 'MPESA'>('CASH');
  processingPayment = signal(false);
  phoneNumber = signal<string>('');

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
    this.phoneNumber.set('');
  }

  setPaymentMethod(method: 'CASH' | 'MPESA'): void {
    this.paymentMethod.set(method);
  }

  confirmPayment(): void {
    const id = this.payingId();
    if (!id) return;
    this.processingPayment.set(true);

    if (this.paymentMethod() === 'CASH') {
      this.pickups.payCash(id).subscribe({
        next: updated => {
          this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.payingId.set(null);
          this.processingPayment.set(false);
          alert('Cash payment recorded. You earned 50 points!');
        },
        error: () => {
          alert('Failed to complete cash payment.');
          this.processingPayment.set(false);
        }
      });
    } else {
      if (!this.phoneNumber()) {
        alert('Please enter your M-PESA phone number.');
        this.processingPayment.set(false);
        return;
      }

      const pickup = this.pickupList().find(p => p.id === id);
      if (!pickup || !pickup.amount) {
        alert('Invalid pickup amount.');
        this.processingPayment.set(false);
        return;
      }

      this.payments.initiatePayment({
        pickupId: id,
        amount: pickup.amount,
        phone: this.phoneNumber()
      }).subscribe({
        next: (res) => {
          alert(res.message);

          const pollInterval = setInterval(() => {
            this.payments.checkStatus(res.checkoutRequestId).subscribe({
              next: (statusRes) => {
                if (statusRes.status === 'PAID') {
                  clearInterval(pollInterval);
                  this.payingId.set(null);
                  this.processingPayment.set(false);
                  this.pickupList.update(list => list.map(p => {
                    if (p.id === id) return { ...p, paymentStatus: 'PAID', pointsEarned: 50 };
                    return p;
                  }));
                  alert('M-PESA payment successful! You earned 50 points!');
                } else if (statusRes.status === 'FAILED') {
                  clearInterval(pollInterval);
                  this.processingPayment.set(false);
                  alert('Payment failed. Please try again.');
                }
              },
              error: () => {
                clearInterval(pollInterval);
                this.processingPayment.set(false);
                alert('Error checking payment status.');
              }
            });
          }, 3000);

          setTimeout(() => clearInterval(pollInterval), 60000);
        },
        error: err => {
          alert(err.error?.detail || err.message || 'Failed to initiate M-PESA payment.');
          this.processingPayment.set(false);
        }
      });
    }
  }

  cancelPayment(): void {
    this.payingId.set(null);
  }
}