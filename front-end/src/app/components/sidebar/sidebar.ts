import { Component, inject, Output, EventEmitter } from '@angular/core';
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
  @Output() closeRequest = new EventEmitter<void>();

  private auth = inject(AuthService);

  readonly user        = this.auth.currentUser;
  readonly isHousehold = () => this.auth.userRole() === 'household';
  readonly isCollector = () => this.auth.userRole() === 'collector';
  readonly isAdmin     = () => this.auth.userRole() === 'admin';

  householdLinks = [
    { path: '/household/dashboard',       label: 'Dashboard',       icon: 'home'      },
    { path: '/household/schedule-pickup', label: 'Schedule Pickup', icon: 'calendar'  },
    { path: '/household/pickup-history',  label: 'Pickup History',  icon: 'history'   },
    { path: '/household/complaints',      label: 'Complaints',      icon: 'flag'      },
    { path: '/household/profile',         label: 'Profile',         icon: 'user'      },
  ];

  collectorLinks = [
    { path: '/collector/dashboard',       label: 'Dashboard',       icon: 'home'      },
    { path: '/collector/pickup-requests', label: 'Pickup Requests', icon: 'list'      },
    { path: '/collector/earnings',        label: 'Earnings',        icon: 'earnings'  },
    { path: '/collector/complaints',      label: 'My Reports',      icon: 'flag'      },
    { path: '/collector/profile',         label: 'Profile',         icon: 'user'      },
  ];

  adminLinks = [
    { path: '/admin/dashboard',  label: 'Dashboard',  icon: 'home'  },
    { path: '/admin/complaints', label: 'Complaints', icon: 'flag'  },
    { path: '/admin/users',      label: 'Users',      icon: 'users' },
  ];

  logout() { this.auth.logout(); }
}