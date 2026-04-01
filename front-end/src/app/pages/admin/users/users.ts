import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminUserService, AdminUser } from '../../.././services/api/admin-user.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PickupRequest } from '../../../models/pickup.model';

type RoleFilter = 'ALL' | 'household' | 'collector';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  private userSvc   = inject(AdminUserService);
  private pickupSvc = inject(PickupService);

  loading      = signal(true);
  users        = signal<AdminUser[]>([]);
  pickups      = signal<PickupRequest[]>([]);
  searchQuery  = signal('');
  roleFilter   = signal<RoleFilter>('ALL');
  selectedUser = signal<AdminUser | null>(null);

  readonly roleFilters: { value: RoleFilter; label: string }[] = [
    { value: 'ALL',       label: 'All Users'  },
    { value: 'household', label: 'Households' },
    { value: 'collector', label: 'Collectors' },
  ];

  readonly filtered = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const role = this.roleFilter();
    return this.users()
      .filter(u => role === 'ALL' || u.role === role)
      .filter(u =>
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)  ||
        u.email.toLowerCase().includes(q)     ||
        u.phone.includes(q)
      );
  });

  readonly stats = computed(() => ({
    total:      this.users().length,
    households: this.users().filter(u => u.role === 'household').length,
    collectors: this.users().filter(u => u.role === 'collector').length,
    active:     this.users().filter(u => u.isActive).length,
  }));

  readonly userPickups = computed(() => {
    const uid = this.selectedUser()?.id;
    if (!uid) return [];
    return this.pickups().filter(p => p.userId === uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  ngOnInit(): void {
    let done = 0;
    const check = () => { if (++done === 2) this.loading.set(false); };
    this.userSvc.getAllUsers().subscribe({ next: d => { this.users.set(d); check(); }, error: check });
    this.pickupSvc.getAllPickups().subscribe({ next: d => { this.pickups.set(d); check(); }, error: check });
  }

  openUser(u: AdminUser): void { this.selectedUser.set(u); }
  closeUser(): void             { this.selectedUser.set(null); }

  pickupStatusClass(s: string): string {
    return { PENDING:'badge--pending', ASSIGNED:'badge--assigned', COMPLETED:'badge--completed', CANCELLED:'badge--cancelled' }[s] ?? '';
  }

  wasteIcon(t: string): string {
    return { general:'🗑️', recyclable:'♻️', organic:'🌿', electronic:'💻', hazardous:'⚠️' }[t] ?? '📦';
  }
}