import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PickupRequest } from '../../../models/pickup.model';

@Component({
  selector: 'app-collector-dashboard',
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
  allPickups    = signal<PickupRequest[]>([]);

  readonly stats = computed(() => {
    const list = this.allPickups();
    return {
      completed: list.filter(p => p.status === 'COMPLETED').length,
      active:    list.filter(p => p.status === 'ASSIGNED').length,
      pending:   list.filter(p => p.status === 'PENDING').length,
      earnings:  list.filter(p => p.status === 'COMPLETED')
                     .reduce((s, p) => s + (p.amount ?? 0), 0)
    };
  });

  readonly assignedPickups = computed(() =>
    this.allPickups()
      .filter(p => p.status === 'ASSIGNED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  readonly recentPending = computed(() =>
    this.allPickups()
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  );

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