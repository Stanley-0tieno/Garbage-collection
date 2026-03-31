import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/api/auth.service';
import { NotificationService } from '../../services/api/notification.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

const TITLE_MAP: Record<string, string> = {
  '/household/dashboard':       'Dashboard',
  '/household/schedule-pickup': 'Schedule Pickup',
  '/household/pickup-history':  'Pickup History',
  '/household/complaints':      'My Complaints',
  '/household/complaints/new':  'New Complaint',
  '/household/profile':         'My Profile',
  '/collector/dashboard':       'Dashboard',
  '/collector/pickup-requests': 'Pickup Requests',
  '/collector/earnings':        'Earnings',
  '/collector/complaints':      'My Reports',
  '/collector/complaints/new':  'Report Issue',
  '/collector/profile':         'My Profile',
  '/admin/dashboard':           'Admin Dashboard',
  '/admin/complaints':          'All Complaints',
  '/admin/users':               'Users',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, NotificationPanelComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  private auth   = inject(AuthService);
  private router = inject(Router);
  notifService   = inject(NotificationService);

  readonly user  = this.auth.currentUser;
  readonly today = new Date();

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => TITLE_MAP[(e as NavigationEnd).urlAfterRedirects] ?? '')
    ),
    { initialValue: TITLE_MAP[this.router.url] ?? '' }
  );
}