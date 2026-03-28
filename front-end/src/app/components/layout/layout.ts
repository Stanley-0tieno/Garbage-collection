import { Component, signal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [NavbarComponent, RouterModule, SidebarComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  sidebarOpen = signal(false);
  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }
}