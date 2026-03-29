import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickupStatus } from '../../models/pickup.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="badge__dot"></span>
      {{ label }}
    </span>
  `,
  styleUrl: './status-badge.scss'
})
export class StatusBadgeComponent {
  @Input() status: PickupStatus | string = 'PENDING';

  get badgeClass(): string {
    return {
      PENDING:   'badge--pending',
      ASSIGNED:  'badge--assigned',
      COMPLETED: 'badge--completed',
      CANCELLED: 'badge--cancelled',
    }[this.status] ?? 'badge--pending';
  }

  get label(): string {
    return {
      PENDING:   'Pending',
      ASSIGNED:  'Assigned',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    }[this.status] ?? this.status;
  }
}