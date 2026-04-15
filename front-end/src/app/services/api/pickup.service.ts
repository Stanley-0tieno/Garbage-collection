import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PickupRequest, CreatePickupRequest, PickupStatus, WASTE_PRICES_PER_KG, WasteType } from '../../models/pickup.model';

const API_URL = 'http://localhost:8000/api';
const USE_MOCK = false;
const STORE_KEY = 'w2w_pickups';

@Injectable({ providedIn: 'root' })
export class PickupService {
  private http = inject(HttpClient);

  getMyPickups(userId: string): Observable<PickupRequest[]> {
    if (USE_MOCK) return this.mockGetPickups(userId);
    return this.http.get<PickupRequest[]>(`${API_URL}/pickups/my`);
  }

  getAllPickups(): Observable<PickupRequest[]> {
    if (USE_MOCK) return this.mockGetAll();
    return this.http.get<PickupRequest[]>(`${API_URL}/pickups`);
  }

  createPickup(userId: string, payload: CreatePickupRequest): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockCreate(userId, payload);
    return this.http.post<PickupRequest>(`${API_URL}/pickups`, payload);
  }

  /**
   * Update pickup status.
   * ASSIGNED: no amount or weightKg required — call with just (id, 'ASSIGNED').
   * COMPLETED: pass weightKg; backend calculates final amount from system prices.
   *            amount is also sent as a client-calculated fallback.
   */
  updateStatus(
    pickupId: string,
    status: PickupStatus,
    amount?: number,
    weightKg?: number,
  ): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockUpdateStatus(pickupId, status, amount, weightKg);
    return this.http.patch<PickupRequest>(
      `${API_URL}/pickups/${pickupId}/status`,
      { status, amount, weightKg }
    );
  }

  assignDate(pickupId: string, date: string): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockAssignDate(pickupId, date);
    return this.http.patch<PickupRequest>(`${API_URL}/pickups/${pickupId}/date`, { date });
  }

  payCash(pickupId: string): Observable<PickupRequest> {
    if (USE_MOCK) return this.mockPayCash(pickupId);
    return this.http.patch<PickupRequest>(`${API_URL}/pickups/${pickupId}/pay-cash`, {});
  }

  private load(): PickupRequest[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : this.seedData();
    } catch { return []; }
  }

  private save(data: PickupRequest[]): void {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  private mockGetPickups(userId: string): Observable<PickupRequest[]> {
    return of(this.load().filter(p => p.userId === userId)).pipe(delay(400));
  }

  private mockGetAll(): Observable<PickupRequest[]> {
    return of(this.load()).pipe(delay(400));
  }

  private mockCreate(userId: string, payload: CreatePickupRequest): Observable<PickupRequest> {
    const all = this.load();
    const area = (payload as any).area ?? payload.address?.split(',')[0]?.trim() ?? '';
    const wasteStr = Array.isArray((payload as any).wasteType)
      ? ((payload as any).wasteType as string[]).join(',')
      : (payload as any).wasteType ?? 'general';

    const newPickup = {
      id: 'pickup_' + Date.now(), userId,
      wasteType: wasteStr,
      area, address: payload.address, notes: payload.notes,
      status: 'PENDING', createdAt: new Date().toISOString(), paymentStatus: 'UNPAID',
    } as unknown as PickupRequest;

    all.push(newPickup);
    this.save(all);
    return of(newPickup).pipe(delay(600));
  }

  private mockUpdateStatus(
    pickupId: string, status: PickupStatus, amount?: number, weightKg?: number,
  ): Observable<PickupRequest> {
    const all = this.load();
    const idx = all.findIndex(p => p.id === pickupId);
    if (idx === -1) return throwError(() => ({ error: { message: 'Pickup not found' } }));

    let finalAmount = amount;
    if (weightKg && weightKg > 0) {
      const primaryType = ((all[idx].wasteType as string) ?? 'general').split(',')[0].trim() as WasteType;
      const rate = WASTE_PRICES_PER_KG[primaryType] ?? 5;
      finalAmount = Math.round(weightKg * rate);
    }

    all[idx] = {
      ...all[idx], status,
      ...(weightKg ? { weightKg } : {}),
      ...(finalAmount ? { amount: finalAmount } : {}),
      ...(status === 'COMPLETED' ? {
        completedAt: new Date().toISOString()
      } : {}),
    };
    this.save(all);
    return of(all[idx]).pipe(delay(500));
  }

  private mockPayCash(pickupId: string): Observable<PickupRequest> {
    const all = this.load();
    const idx = all.findIndex(p => p.id === pickupId);
    if (idx === -1) return throwError(() => ({ error: { message: 'Pickup not found' } }));
    all[idx] = { ...all[idx], paymentStatus: 'PAID', pointsEarned: 50 };
    this.save(all);
    return of(all[idx]).pipe(delay(400));
  }

  private mockAssignDate(pickupId: string, date: string): Observable<PickupRequest> {
    const all = this.load();
    const idx = all.findIndex(p => p.id === pickupId);
    if (idx === -1) return throwError(() => ({ error: { message: 'Pickup not found' } }));
    all[idx] = { ...all[idx], date };
    this.save(all);
    return of(all[idx]).pipe(delay(400));
  }

  private seedData(): PickupRequest[] {
    const uid = this.getMockUserId();
    const data = [
      {
        id: 'pickup_001', userId: uid, wasteType: 'recyclable', date: '2026-03-10',
        address: '14 Moi Avenue, Westlands, Nairobi', status: 'COMPLETED',
        collectorName: 'John Kamau', completedAt: '2026-03-10T10:30:00Z',
        pointsEarned: 50, createdAt: '2026-03-08T08:00:00Z', paymentStatus: 'PAID', amount: 240
      },
      {
        id: 'pickup_002', userId: uid, wasteType: 'organic', date: '2026-03-18',
        address: '22 Ngong Road, Kilimani, Nairobi', status: 'ASSIGNED',
        collectorName: 'Mary Wanjiku', createdAt: '2026-03-15T09:00:00Z', paymentStatus: 'UNPAID'
      },
      {
        id: 'pickup_003', userId: uid, wasteType: 'general',
        address: '5 Waiyaki Way, Westlands, Nairobi', status: 'PENDING',
        createdAt: '2026-03-20T11:00:00Z', paymentStatus: 'UNPAID'
      },
      {
        id: 'pickup_004', userId: 'user_other', wasteType: 'electronic',
        address: '10 Karen Road, Karen, Nairobi', status: 'PENDING',
        createdAt: '2026-03-21T07:00:00Z', paymentStatus: 'UNPAID'
      },
      {
        id: 'pickup_005', userId: 'user_other', wasteType: 'hazardous',
        address: '8 Argwings Kodhek, Kilimani, Nairobi', status: 'PENDING',
        createdAt: '2026-03-22T09:30:00Z', paymentStatus: 'UNPAID'
      },
    ] as unknown as PickupRequest[];
    this.save(data);
    return data;
  }

  private getMockUserId(): string {
    try { return JSON.parse(localStorage.getItem('w2w_user') ?? '{}').id ?? 'user_demo'; }
    catch { return 'user_demo'; }
  }
}