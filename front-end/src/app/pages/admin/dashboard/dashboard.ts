import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminUserService, AdminUser } from '../../.././services/api/admin-user.service';
import { ComplaintService } from '../../../services/api/complaint.service';
import { PickupService } from '../../../services/api/pickup.service';
import { Complaint } from '../../../models/complaint.model';
import { PickupRequest } from '../../../models/pickup.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private userSvc      = inject(AdminUserService);
  readonly complaintSvc = inject(ComplaintService);
  private pickupSvc    = inject(PickupService);

  loading    = signal(true);
  users      = signal<AdminUser[]>([]);
  complaints = signal<Complaint[]>([]);
  pickups    = signal<PickupRequest[]>([]);

  readonly stats = computed(() => {
    const u = this.users(); const p = this.pickups(); const c = this.complaints();
    return {
      totalUsers:       u.length,
      households:       u.filter(x => x.role === 'household').length,
      collectors:       u.filter(x => x.role === 'collector').length,
      totalPickups:     p.length,
      pendingPickups:   p.filter(x => x.status === 'PENDING').length,
      completedPickups: p.filter(x => x.status === 'COMPLETED').length,
      totalRevenue:     p.filter(x => x.status === 'COMPLETED').reduce((s, x) => s + (x.amount ?? 0), 0),
      openComplaints:   c.filter(x => x.status === 'OPEN' || x.status === 'IN_REVIEW').length,
    };
  });

  readonly recentPickups     = computed(() => [...this.pickups()].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5));
  readonly recentComplaints  = computed(() => [...this.complaints()].filter(c => c.status === 'OPEN' || c.status === 'IN_REVIEW').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,4));
  readonly recentUsers       = computed(() => [...this.users()].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5));

  ngOnInit(): void {
    let done = 0;
    const check = () => { if (++done === 3) this.loading.set(false); };
    this.userSvc.getAllUsers().subscribe({ next: d => { this.users.set(d); check(); }, error: check });
    this.complaintSvc.getAllComplaints().subscribe({ next: d => { this.complaints.set(d); check(); }, error: check });
    this.pickupSvc.getAllPickups().subscribe({ next: d => { this.pickups.set(d); check(); }, error: check });
  }

  pickupStatusClass(s: string) { return { PENDING:'badge--pending', ASSIGNED:'badge--assigned', COMPLETED:'badge--completed', CANCELLED:'badge--cancelled' }[s] ?? ''; }
  complaintStatusClass(s: string) { return { OPEN:'status--open', IN_REVIEW:'status--review', RESOLVED:'status--resolved', CLOSED:'status--closed' }[s] ?? ''; }
  wasteIcon(t: string) { return { general:'🗑️', recyclable:'♻️', organic:'🌿', electronic:'💻', hazardous:'⚠️' }[t] ?? '📦'; }
}