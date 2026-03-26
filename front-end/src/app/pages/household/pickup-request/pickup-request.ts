import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PickupService } from '../../../services/api/pickup.service';
import { PickupRequest, PickupStatus } from '../../../models/pickup.model';

type FilterStatus = 'ALL' | PickupStatus;

@Component({
  selector: 'app-pickup-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pickup-request.html',
  styleUrl: './pickup-request.scss'
})
export class PickupRequestsComponent implements OnInit {
  private pickupService = inject(PickupService);

  loading      = signal(true);
  pickupList   = signal<PickupRequest[]>([]);
  activeFilter = signal<FilterStatus>('ALL');
  updatingId   = signal<string | null>(null);

  readonly filters: { value: FilterStatus; label: string }[] = [
    { value: 'ALL',       label: 'All'       },
    { value: 'PENDING',   label: 'Pending'   },
    { value: 'ASSIGNED',  label: 'Assigned'  },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const list = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return f === 'ALL' ? list : list.filter(p => p.status === f);
  });

  ngOnInit(): void {
    this.pickupService.getAllPickups().subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  setFilter(f: FilterStatus) { this.activeFilter.set(f); }

  updateStatus(pickup: PickupRequest, status: PickupStatus): void {
    this.updatingId.set(pickup.id);
    this.pickupService.updateStatus(pickup.id, status).subscribe({
      next: updated => {
        this.pickupList.update(list =>
          list.map(p => p.id === updated.id ? updated : p)
        );
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null)
    });
  }

  statusClass(status: string): string {
    return { PENDING: 'badge--pending', ASSIGNED: 'badge--assigned', COMPLETED: 'badge--completed', CANCELLED: 'badge--cancelled' }[status] ?? '';
  }

  wasteLabel(type: string): string {
    return { general: 'General Waste', recyclable: 'Recyclable', organic: 'Organic', electronic: 'Electronic', hazardous: 'Hazardous' }[type] ?? type;
  }

  wasteIcon(type: string): string {
    return { general: '🗑️', recyclable: '♻️', organic: '🌿', electronic: '💻', hazardous: '⚠️' }[type] ?? '📦';
  }
}