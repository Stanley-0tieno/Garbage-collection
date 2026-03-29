import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PickupService } from '../../../services/api/pickup.service';
import { AuthService } from '../../../services/api/auth.service';
import { PickupRequest } from '../../../models/pickup.model';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './earnings.html',
  styleUrl: './earnings.scss'
})
export class EarningsComponent implements OnInit {
  private pickups = inject(PickupService);
  private auth    = inject(AuthService);

  loading    = signal(true);
  allPickups = signal<PickupRequest[]>([]);

  readonly completed = computed(() =>
    [...this.allPickups()]
      .filter(p => p.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())
  );

  readonly totalEarnings = computed(() =>
    this.completed().reduce((s, p) => s + (p.amount ?? 0), 0)
  );

  readonly thisMonthEarnings = computed(() => {
    const now = new Date();
    return this.completed()
      .filter(p => {
        const d = new Date(p.completedAt ?? p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, p) => s + (p.amount ?? 0), 0);
  });

  ngOnInit(): void {
    this.pickups.getAllPickups().subscribe({
      next: data => { this.allPickups.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  wasteIcon(t: string) {
    return { general:'🗑️', recyclable:'♻️', organic:'🌿', electronic:'💻', hazardous:'⚠️' }[t] ?? '📦';
  }

  wasteLabel(t: string) {
    return { general:'General Waste', recyclable:'Recyclable', organic:'Organic',
             electronic:'Electronic', hazardous:'Hazardous' }[t] ?? t;
  }
}