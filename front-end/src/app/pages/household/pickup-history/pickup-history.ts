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
  private auth    = inject(AuthService);
  private pickups = inject(PickupService);

  loading      = signal(true);
  pickupList   = signal<PickupRequest[]>([]);
  activeFilter = signal<FilterStatus>('ALL');

  readonly filters: { value: FilterStatus; label: string }[] = [
    { value: 'ALL',       label: 'All'       },
    { value: 'PENDING',   label: 'Pending'   },
    { value: 'ASSIGNED',  label: 'Assigned'  },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  readonly filtered = computed(() => {
    const f    = this.activeFilter();
    const list = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return f === 'ALL' ? list : list.filter(p => p.status === f);
  });

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id ?? '';
    this.pickups.getMyPickups(userId).subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
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
}