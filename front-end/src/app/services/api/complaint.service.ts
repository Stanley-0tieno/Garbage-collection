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
}