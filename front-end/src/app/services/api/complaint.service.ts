import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Complaint, CreateComplaintRequest } from '../../models/complaint.model';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);

  createComplaint(payload: CreateComplaintRequest): Observable<Complaint> {
    return this.http.post<Complaint>(`${API}/complaints`, payload);
  }

  getMyComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${API}/complaints/my`);
  }

  getAllComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${API}/complaints`);
  }

  resolveComplaint(id: string, status: string, adminNote?: string): Observable<Complaint> {
    return this.http.patch<Complaint>(`${API}/complaints/${id}`, { status, adminNote });
  }

  // ── Helpers ────────────────────────────────────────────
  issueLabel(type: string): string {
    return {
      late_pickup:          'Late Pickup',
      missed_pickup:        'Missed Pickup',
      bad_service:          'Bad Service',
      payment_issue:        'Payment Issue',
      customer_unavailable: 'Customer Unavailable',
      wrong_address:        'Wrong Address',
      unsafe_conditions:    'Unsafe Conditions',
      payment_not_received: 'Payment Not Received',
      safety_issue:         'Safety Issue',
      other:                'Other',
    }[type] ?? type;
  }

  statusColor(status: string): string {
    return {
      OPEN:      'status--open',
      IN_REVIEW: 'status--review',
      RESOLVED:  'status--resolved',
      CLOSED:    'status--closed',
    }[status] ?? '';
  }
}