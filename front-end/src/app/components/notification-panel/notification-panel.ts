import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/api/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss'
})
export class NotificationPanelComponent {
  notifService = inject(NotificationService);

  iconFor(type: string): string {
    const map: Record<string, string> = {
      pickup_accepted:   '✅',
      pickup_assigned:   '🚛',
      pickup_completed:  '🏆',
      pickup_available:  '📦',
      complaint_resolved:'🛡️',
      payment_confirmed: '💰',
      general:           '🔔',
    };
    return map[type] ?? '🔔';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}