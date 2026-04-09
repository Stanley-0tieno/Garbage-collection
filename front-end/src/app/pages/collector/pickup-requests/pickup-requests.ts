import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PickupService } from '../../../services/api/pickup.service';
import { ToastService } from '../../../services/toast/toast.service';
import { PickupCardComponent } from '../../../components/pickup-card/pickup-card';
// import { StatusBadgeComponent } from '../../../components/status-badge/status-badge';
import { PickupRequest, PickupStatus } from '../../../models/pickup.model';

type Filter = 'ALL' | PickupStatus;

@Component({
  selector: 'app-pickup-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, PickupCardComponent],
  templateUrl: './pickup-requests.html',
  styleUrl: './pickup-requests.scss'
})
export class PickupRequests implements OnInit {
  private pickupService = inject(PickupService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  pickupList = signal<PickupRequest[]>([]);
  activeFilter = signal<Filter>('ALL');
  updatingId = signal<string | null>(null);
  confirmingId = signal<string | null>(null); // for accept confirm dialog
  acceptAmount = signal<number | null>(null);

  readonly filters: { value: Filter; label: string; count: () => number }[] = [
    { value: 'ALL', label: 'All', count: () => this.pickupList().length },
    { value: 'PENDING', label: 'Pending', count: () => this.pickupList().filter(p => p.status === 'PENDING').length },
    { value: 'ASSIGNED', label: 'My Jobs', count: () => this.pickupList().filter(p => p.status === 'ASSIGNED').length },
    { value: 'COMPLETED', label: 'Completed', count: () => this.pickupList().filter(p => p.status === 'COMPLETED').length },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const list = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return f === 'ALL' ? list : list.filter(p => p.status === f);
  });

  ngOnInit(): void {
    this.pickupService.getAllPickups().subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); this.checkHighlight(); },
      error: () => this.loading.set(false)
    });
  }

  private checkHighlight(): void {
    const id = this.route.snapshot.queryParamMap.get('highlight');
    if (id) {
      setTimeout(() => {
        const el = document.getElementById('pickup-' + id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }

  setFilter(f: Filter) { this.activeFilter.set(f); }

  accept(pickup: PickupRequest): void {
    this.confirmingId.set(pickup.id);
    this.acceptAmount.set(null);
  }

  updateAmount(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.acceptAmount.set(Number(el.value));
  }

  confirmAccept(): void {
    const id = this.confirmingId();
    if (!id || !this.acceptAmount()) return;
    this.updatingId.set(id);
    this.confirmingId.set(null);

    this.pickupService.updateStatus(id, 'ASSIGNED', this.acceptAmount()!).subscribe({
      next: updated => {
        this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.updatingId.set(null);
        this.toast.success('Job accepted! You have offered your cost.');
      },
      error: () => { this.updatingId.set(null); this.toast.error('Failed to accept job.'); }
    });
  }

  cancelConfirm(): void { this.confirmingId.set(null); }
}