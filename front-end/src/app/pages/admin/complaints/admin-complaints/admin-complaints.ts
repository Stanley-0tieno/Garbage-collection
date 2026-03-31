import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../../../services/api/complaint.service';
import { Complaint } from '../../../../models/complaint.model';
import { FilterPipe } from '../../../../pipes/filter.pipe';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './admin-complaints.html',
  styleUrl: './admin-complaints.scss'
})
export class AdminComplaintsComponent implements OnInit {
  private complaintService = inject(ComplaintService);

  loading      = signal(true);
  list         = signal<Complaint[]>([]);
  activeFilter = signal('ALL');
  selected     = signal<Complaint | null>(null);
  adminNote    = signal('');
  resolving    = signal(false);

  readonly filters = [
    { value: 'ALL', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'ALL' ? this.list() : this.list().filter(c => c.status === f);
  });

  ngOnInit(): void {
    this.complaintService.getAllComplaints().subscribe({
      next: data => { this.list.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  openDetail(c: Complaint): void {
    this.selected.set(c);
    this.adminNote.set(c.adminNote ?? '');
  }

  closeDetail(): void { this.selected.set(null); }

  updateStatus(status: string): void {
    const c = this.selected();
    if (!c) return;
    this.resolving.set(true);
    this.complaintService.resolveComplaint(c.id, status, this.adminNote()).subscribe({
      next: updated => {
        this.list.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.selected.set(updated);
        this.resolving.set(false);
      },
      error: () => this.resolving.set(false)
    });
  }

  statusClass(s: string): string {
    return { OPEN: 'badge--pending', IN_REVIEW: 'badge--assigned', RESOLVED: 'badge--completed', CLOSED: 'badge--cancelled' }[s] ?? '';
  }

  issueLabel(type: string): string {
    return {
      late_pickup: 'Late Pickup', missed_pickup: 'Missed Pickup',
      bad_service: 'Bad Service', payment_issue: 'Payment Issue',
      customer_unavailable: 'Customer Unavailable',
      wrong_address: 'Wrong Address', safety_issue: 'Safety Issue', other: 'Other'
    }[type] ?? type;
  }
}