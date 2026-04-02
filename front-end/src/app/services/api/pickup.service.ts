import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PickupRequest, CreatePickupRequest, PickupStatus } from '../../models/pickup.model';

const API_URL  = 'http://localhost:8000/api';
const USE_MOCK = false;
const STORE_KEY = 'w2w_pickups';

@Injectable({ providedIn: 'root' })
export class PickupService {
  private http = inject(HttpClient);

  // ── Get all pickups for logged-in user ─────────────────
  getMyPickups(userId: string): Observable<PickupRequest[]> {
    if (USE_MOCK) return this.mockGetPickups(userId);
    return this.http.get<PickupRequest[]>(`${API_URL}/pickups/my`);
  }

  // ── Get all pickups (collector view) ───────────────────
  getAllPickups(): Observable<PickupRequest[]> {
    if (USE_MOCK) return this.mockGetAll();
    return this.http.get<PickupRequest[]>(`${API_URL}/pickups`);
  }

  // ── Create pickup ──────────────────────────────────────
  createPickup(userId: string, payload: CreatePickupRequest): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockCreate(userId, payload);
    return this.http.post<PickupRequest>(`${API_URL}/pickups`, payload);
  }

  // ── Update status (collector) ──────────────────────────
  updateStatus(pickupId: string, status: PickupStatus): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockUpdateStatus(pickupId, status);
    return this.http.patch<PickupRequest>(`${API_URL}/pickups/${pickupId}/status`, { status });
  }

  // ── Helpers ────────────────────────────────────────────
  private load(): PickupRequest[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : this.seedData();
    } catch { return []; }
  }

  private save(data: PickupRequest[]): void {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  // ── Mock implementations ───────────────────────────────
  private mockGetPickups(userId: string): Observable<PickupRequest[]> {
    const all = this.load();
    return of(all.filter(p => p.userId === userId)).pipe(delay(400));
  }

  private mockGetAll(): Observable<PickupRequest[]> {
    return of(this.load()).pipe(delay(400));
  }

  private mockCreate(userId: string, payload: CreatePickupRequest): Observable<PickupRequest> {
    const all = this.load();
    const newPickup: PickupRequest = {
      id: 'pickup_' + Date.now(),
      userId,
      wasteType: payload.wasteType,
      date: payload.date,
      address: payload.address,
      notes: payload.notes,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      paymentStatus: 'PENDING'
    };
    all.push(newPickup);
    this.save(all);
    return of(newPickup).pipe(delay(600));
  }

  private mockUpdateStatus(pickupId: string, status: PickupStatus): Observable<PickupRequest> {
    const all = this.load();
    const idx = all.findIndex(p => p.id === pickupId);
    if (idx === -1) return throwError(() => ({ error: { message: 'Pickup not found' } }));

    all[idx] = {
      ...all[idx],
      status,
      ...(status === 'COMPLETED' ? {
        completedAt:  new Date().toISOString(),
        pointsEarned: 50
      } : {})
    };
    this.save(all);
    return of(all[idx]).pipe(delay(500));
  }

  // ── Seed data for demo ─────────────────────────────────
  private seedData(): PickupRequest[] {
    const mockUserId = this.getMockUserId();
    const data: PickupRequest[] = [
      {
        id: 'pickup_001', userId: mockUserId,
        wasteType: 'recyclable', date: '2026-03-10',
        address: '14 Moi Avenue, Nairobi',
        status: 'COMPLETED', collectorName: 'John Kamau',
        completedAt: '2026-03-10T10:30:00Z', pointsEarned: 50,
        createdAt: '2026-03-08T08:00:00Z',
        paymentStatus: 'PENDING'
      },
      {
        id: 'pickup_002', userId: mockUserId,
        wasteType: 'organic', date: '2026-03-18',
        address: '14 Moi Avenue, Nairobi',
        status: 'ASSIGNED', collectorName: 'Mary Wanjiku',
        createdAt: '2026-03-15T09:00:00Z',
        paymentStatus: 'PENDING'
      },
      {
        id: 'pickup_003', userId: mockUserId,
        wasteType: 'general', date: '2026-03-28',
        address: '14 Moi Avenue, Nairobi',
        status: 'PENDING',
        createdAt: '2026-03-20T11:00:00Z',
        paymentStatus: 'PENDING'
      }
    ];
    this.save(data);
    return data;
  }

  private getMockUserId(): string {
    try {
      const raw = localStorage.getItem('w2w_user');
      return raw ? JSON.parse(raw).id : 'user_demo';
    } catch { return 'user_demo'; }
  }
}