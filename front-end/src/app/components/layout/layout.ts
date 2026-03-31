import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { NotificationService } from '../../services/api/notification.service';

@Component({
  selector: 'app-layout',
  imports: [NavbarComponent, RouterModule, SidebarComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);

  sidebarOpen = signal(false);
  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }

  ngOnInit()    { this.notifService.startPolling(); }
  ngOnDestroy() { this.notifService.stopPolling(); }
}