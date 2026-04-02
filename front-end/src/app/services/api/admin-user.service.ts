import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

export interface AdminUser extends User {
  createdAt: string;
  totalPickups?: number;
  completedPickups?: number;
  totalSpent?: number;
  totalEarned?: number;
  isActive: boolean;
}

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${API}/admin/users`);
  }
}