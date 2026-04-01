import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../../models/user.model';

export interface AdminUser extends User {
  createdAt: string;
  totalPickups?: number;
  completedPickups?: number;
  totalSpent?: number;
  totalEarned?: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {

  getAllUsers(): Observable<AdminUser[]> {
    return of(this.buildUsers()).pipe(delay(500));
  }

  private buildUsers(): AdminUser[] {
    const realUsers: User[] = (() => {
      try { return JSON.parse(localStorage.getItem('w2w_mock_users') ?? '[]'); } catch { return []; }
    })();

    const pickups: any[] = (() => {
      try { return JSON.parse(localStorage.getItem('w2w_pickups') ?? '[]'); } catch { return []; }
    })();

    const enrich = (u: User, seed?: Partial<AdminUser>): AdminUser => {
      const up = pickups.filter(p => p.userId === u.id);
      const cp = up.filter(p => p.status === 'COMPLETED');
      return {
        ...u,
        createdAt:        seed?.createdAt ?? new Date().toISOString(),
        isActive:         seed?.isActive ?? true,
        totalPickups:     up.length || (seed?.totalPickups ?? 0),
        completedPickups: cp.length || (seed?.completedPickups ?? 0),
        totalSpent:       u.role === 'household' ? cp.reduce((s, p) => s + (p.amount ?? 0), 0) || (seed?.totalSpent ?? 0) : undefined,
        totalEarned:      u.role === 'collector' ? cp.reduce((s, p) => s + (p.amount ?? 0), 0) || (seed?.totalEarned ?? 0) : undefined,
        points:           u.points ?? 0
      };
    };

    const seed: AdminUser[] = [
      { id:'seed_h1', firstName:'Jane',   lastName:'Mwangi',  email:'jane@demo.com',   phone:'0712000001', role:'household', points:150, isActive:true,  createdAt:'2026-01-15T09:00:00Z', totalPickups:4, completedPickups:3, totalSpent:450 },
      { id:'seed_h2', firstName:'Brian',  lastName:'Otieno',  email:'brian@demo.com',  phone:'0712000002', role:'household', points:50,  isActive:true,  createdAt:'2026-02-03T10:00:00Z', totalPickups:2, completedPickups:1, totalSpent:150 },
      { id:'seed_c1', firstName:'John',   lastName:'Kamau',   email:'john@demo.com',   phone:'0712000003', role:'collector', points:0,   isActive:true,  createdAt:'2026-01-10T08:00:00Z', totalPickups:7, completedPickups:6, totalEarned:900 },
      { id:'seed_c2', firstName:'Mary',   lastName:'Wanjiku', email:'mary@demo.com',   phone:'0712000004', role:'collector', points:0,   isActive:false, createdAt:'2026-01-20T11:00:00Z', totalPickups:3, completedPickups:2, totalEarned:300 },
      { id:'seed_h3', firstName:'Samuel', lastName:'Njoroge', email:'samuel@demo.com', phone:'0712000005', role:'household', points:200, isActive:true,  createdAt:'2026-02-14T14:00:00Z', totalPickups:5, completedPickups:4, totalSpent:600 },
    ];

    const realEnriched = realUsers.map(u => enrich(u));
    const realIds      = new Set(realEnriched.map(u => u.id));
    return [...realEnriched, ...seed.filter(u => !realIds.has(u.id))];
  }
}