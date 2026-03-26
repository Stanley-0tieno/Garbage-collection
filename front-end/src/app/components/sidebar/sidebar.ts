import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/api/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  private auth = inject(AuthService);

  readonly user     = this.auth.currentUser;
  readonly isHousehold = () => this.auth.userRole() === 'household';

  householdLinks = [
    { path: '/household/dashboard',      label: 'Dashboard',       icon: 'home' },
    { path: '/household/schedule-pickup', label: 'Schedule Pickup', icon: 'calendar' },
    { path: '/household/pickup-history',  label: 'Pickup History',  icon: 'history' },
  ];

  collectorLinks = [
    { path: '/collector/dashboard',       label: 'Dashboard',        icon: 'home' },
    { path: '/collector/pickup-requests', label: 'Pickup Requests',  icon: 'list' },
  ];

  logout() { this.auth.logout(); }
}