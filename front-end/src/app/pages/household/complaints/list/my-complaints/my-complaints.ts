import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintService } from '../../../../../services/api/complaint.service';
import { Complaint, ComplaintStatus } from '../../../../../models/complaint.model';

type Filter = 'ALL' | ComplaintStatus;

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-complaints.html',
  styleUrl: './my-complaints.scss'
})
export class MyComplaintsComponent implements OnInit {
  private complaintService = inject(ComplaintService);

  loading      = signal(true);
  list         = signal<Complaint[]>([]);
  activeFilter = signal<Filter>('ALL');

  readonly filters: { value: Filter; label: string }[] = [
    { value: 'ALL',       label: 'All'       },
    { value: 'OPEN',      label: 'Open'      },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'RESOLVED',  label: 'Resolved'  },
    { value: 'CLOSED',    label: 'Closed'    },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const list = [...this.list()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return f === 'ALL' ? list : list.filter(c => c.status === f);
  });

  ngOnInit(): void {
    this.complaintService.getMyComplaints().subscribe({
      next: data => { this.list.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  statusClass(s: string): string {
    return {
      OPEN:      'badge--pending',
      IN_REVIEW: 'badge--assigned',
      RESOLVED:  'badge--completed',
      CLOSED:    'badge--cancelled'
    }[s] ?? '';
  }

  issueLabel(type: string): string {
    return {
      late_pickup:   'Late Pickup',
      missed_pickup: 'Missed Pickup',
      bad_service:   'Bad Service',
      payment_issue: 'Payment Issue',
      other:         'Other'
    }[type] ?? type;
  }
}