import { Component, inject, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/api/auth.service';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

const TITLE_MAP: Record<string, string> = {
  '/household/dashboard':      'Dashboard',
  '/household/schedule-pickup':'Schedule Pickup',
  '/household/pickup-history': 'Pickup History',
  '/collector/dashboard':      'Dashboard',
  '/collector/pickup-requests':'Pickup Requests',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, DatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  private auth   = inject(AuthService);
  private router = inject(Router);
  readonly user  = this.auth.currentUser;
  readonly today = new Date();

  // Auto-derive page title from current route — no @Input needed
  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => TITLE_MAP[(e as NavigationEnd).urlAfterRedirects] ?? '')
    ),
    { initialValue: TITLE_MAP[this.router.url] ?? '' }
  );
}