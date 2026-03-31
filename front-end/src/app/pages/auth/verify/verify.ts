// src/app/pages/auth/verify/verify.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/api/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif;">
      <div *ngIf="status() === 'loading'">
        <p style="font-size:1.2rem; color:#555;">Verifying your email...</p>
      </div>
      <div *ngIf="status() === 'success'" style="text-align:center;">
        <p style="font-size:2rem;">✅</p>
        <p style="font-size:1.2rem; color:#2e7d32;">Email confirmed! Redirecting to login...</p>
      </div>
      <div *ngIf="status() === 'error'" style="text-align:center;">
        <p style="font-size:2rem;">❌</p>
        <p style="font-size:1.2rem; color:#c62828;">Invalid or expired confirmation link.</p>
      </div>
    </div>
  `
})
export class VerifyComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private auth   = inject(AuthService);
  private router = inject(Router);

  status = signal<'loading' | 'success' | 'error'>('loading');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.status.set('error'); return; }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
        setTimeout(() => this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }
        }), 2000);
      },
      error: () => this.status.set('error')
    });
  }
}