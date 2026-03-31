import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Notification } from '../../models/notification.model';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  notifications  = signal<Notification[]>([]);
  unreadCount    = signal(0);
  panelOpen      = signal(false);

  private pollSub: Subscription | null = null;

  startPolling(): void {
    this.fetchNotifications();
    this.pollSub = interval(30_000).pipe(
      switchMap(() => this.http.get<Notification[]>(`${API}/notifications`).pipe(
        catchError(() => of([]))
      ))
    ).subscribe(data => this.setNotifications(data));
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  fetchNotifications(): void {
    this.http.get<Notification[]>(`${API}/notifications`).pipe(
      catchError(() => of([]))
    ).subscribe(data => this.setNotifications(data));
  }

  togglePanel(): void {
    this.panelOpen.update(v => !v);
    if (this.panelOpen()) this.fetchNotifications();
  }

  closePanel(): void { this.panelOpen.set(false); }

  markAllRead(): void {
    this.http.patch(`${API}/notifications/mark-read`, {}).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  markOneRead(id: string): void {
    this.http.patch(`${API}/notifications/${id}/read`, {}).subscribe(() => {
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, read: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  private setNotifications(data: Notification[]): void {
    this.notifications.set(data);
    this.unreadCount.set(data.filter(n => !n.read).length);
  }
}