import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { PaymentRequest, PaymentResponse } from '../../models/pickup.model';

const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class PaymentService {

  // ── Initiate STK push ──────────────────────────────────
  initiatePayment(req: PaymentRequest): Observable<PaymentResponse> {
    if (USE_MOCK) return this.mockInitiate(req);
    // Real: return this.http.post<PaymentResponse>(`${API_URL}/payments/mpesa/stk`, req);
    return throwError(() => new Error('Not implemented'));
  }

  // ── Poll payment status ────────────────────────────────
  // Returns 'PAID' | 'PENDING' | 'FAILED'
  checkStatus(checkoutRequestId: string): Observable<{ status: string }> {
    if (USE_MOCK) return this.mockCheckStatus(checkoutRequestId);
    // Real: return this.http.get<{status:string}>(`${API_URL}/payments/status/${checkoutRequestId}`);
    return throwError(() => new Error('Not implemented'));
  }

  // ── Mock: simulates STK push sent ─────────────────────
  private mockInitiate(req: PaymentRequest): Observable<PaymentResponse> {
    const validPhone = /^(07|01|2547|2541)\d{8,9}$/.test(req.phone.replace(/\s/g, ''));
    if (!validPhone) {
      return throwError(() => ({
        error: { detail: 'Invalid M-Pesa phone number. Use format 07XXXXXXXX.' }
      }));
    }

    const checkoutRequestId = 'ws_CO_' + Date.now();
    // Store so poll can find it
    sessionStorage.setItem('mock_checkout_' + checkoutRequestId, 'PENDING');

    // After 4s auto-confirm (simulates user approving on phone)
    setTimeout(() => {
      sessionStorage.setItem('mock_checkout_' + checkoutRequestId, 'PAID');
    }, 4000);

    return of({
      checkoutRequestId,
      message: 'STK push sent to ' + req.phone + '. Check your phone to complete payment.'
    }).pipe(delay(800));
  }

  // ── Mock: returns stored payment status ───────────────
  private mockCheckStatus(checkoutRequestId: string): Observable<{ status: string }> {
    const status = sessionStorage.getItem('mock_checkout_' + checkoutRequestId) ?? 'PENDING';
    return of({ status }).pipe(delay(300));
  }
}