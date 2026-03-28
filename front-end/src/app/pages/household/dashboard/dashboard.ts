import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PickupRequest } from '../../../models/pickup.model';

@Component({
  selector: 'app-household-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private auth    = inject(AuthService);
  private pickups = inject(PickupService);

  readonly user = this.auth.currentUser;
  loading       = signal(true);
  pickupList    = signal<PickupRequest[]>([]);

  readonly stats = computed(() => {
    const list = this.pickupList();
    return {
      total:     list.length,
      pending:   list.filter(p => p.status === 'PENDING').length,
      assigned:  list.filter(p => p.status === 'ASSIGNED').length,
      completed: list.filter(p => p.status === 'COMPLETED').length,
      points:    list.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0)
    };
  });

  readonly recentPickups = computed(() =>
    [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  );

  // Next upcoming pending pickup
  readonly nextPickup = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...this.pickupList()]
      .filter(p => p.status === 'PENDING' && p.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  });

  // Points tier system
  readonly nextTier = computed(() => {
    const pts = this.stats().points;
    if (pts < 100) return 100;
    if (pts < 250) return 250;
    if (pts < 500) return 500;
    return 1000;
  });

  readonly tierName = computed(() => {
    const pts = this.stats().points;
    if (pts < 100) return 'Bronze';
    if (pts < 250) return 'Silver';
    if (pts < 500) return 'Gold';
    return 'Platinum 🏆';
  });

  readonly pointsProgress = computed(() => {
    const pts = this.stats().points;
    const tier = this.nextTier();
    const prev = tier === 100 ? 0 : tier === 250 ? 100 : tier === 500 ? 250 : 500;
    return Math.min(100, ((pts - prev) / (tier - prev)) * 100);
  });

  ngOnInit(): void {
    const userId = this.user()?.id ?? '';
    this.pickups.getMyPickups(userId).subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false)
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