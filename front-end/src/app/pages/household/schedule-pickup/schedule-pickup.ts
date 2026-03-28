import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PaymentService } from '../../../services/api/payment.service';
import { WasteType } from '../../../models/pickup.model';

export interface WasteOption {
  value: WasteType;
  label: string;
  icon: string;
  desc: string;
  basePrice: number;
}

@Component({
  selector: 'app-schedule-pickup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './schedule-pickup.html',
  styleUrl: './schedule-pickup.scss'
})
export class SchedulePickupComponent implements OnDestroy {
  private fb      = inject(FormBuilder);
  private auth    = inject(AuthService);
  private pickups = inject(PickupService);
  private payment = inject(PaymentService);
  private router  = inject(Router);
  private http    = inject(HttpClient);

  currentStep = signal(1);
  totalSteps  = 4;

  loading        = signal(false);
  locating       = signal(false);
  locationError  = signal('');
  errorMessage   = signal('');
  imagePreview   = signal<string | null>(null);

  checkoutRequestId = signal('');
  paymentStatus     = signal<'idle' | 'sending' | 'waiting' | 'paid' | 'failed'>('idle');
  paymentMessage    = signal('');
  pollCount         = signal(0);
  pollSub?: Subscription;
  createdPickupId   = signal('');

  readonly amount = computed(() => {
    const type   = this.detailsForm.get('wasteType')?.value as WasteType;
    const weight = Number(this.detailsForm.get('weightEstimate')?.value ?? 1);
    const base   = this.wasteOptions.find(o => o.value === type)?.basePrice ?? 200;
    return Math.max(base, Math.round(base * weight * 0.8));
  });

  readonly wasteOptions: WasteOption[] = [
    { value: 'general',    label: 'General Waste',  icon: '🗑️', desc: 'Everyday household waste',     basePrice: 150 },
    { value: 'recyclable', label: 'Recyclable',     icon: '♻️', desc: 'Paper, plastic, glass, metal', basePrice: 100 },
    { value: 'organic',    label: 'Organic',        icon: '🌿', desc: 'Food scraps, garden waste',    basePrice: 120 },
    { value: 'electronic', label: 'Electronic',     icon: '💻', desc: 'Old electronics & gadgets',    basePrice: 300 },
    { value: 'hazardous',  label: 'Hazardous',      icon: '⚠️', desc: 'Chemicals, batteries, paint', basePrice: 500 },
  ];

  readonly weightOptions = [
    { value: 1, label: '< 5 kg',   desc: 'Small bag'   },
    { value: 2, label: '5–15 kg',  desc: 'Medium load' },
    { value: 3, label: '15–30 kg', desc: 'Large load'  },
    { value: 5, label: '30+ kg',   desc: 'Bulk waste'  },
  ];

  readonly minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  detailsForm: FormGroup = this.fb.group({
    wasteType:      ['', Validators.required],
    weightEstimate: [1,  Validators.required],
    date:           ['', Validators.required],
    address:        ['', [Validators.required, Validators.minLength(5)]],
    notes:          [''],
    imageUrl:       ['']
  });

  paymentForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^(07|01)\d{8}$/)]]
  });

  get wasteType()      { return this.detailsForm.get('wasteType')!; }
  get date()           { return this.detailsForm.get('date')!; }
  get address()        { return this.detailsForm.get('address')!; }
  get weightEstimate() { return this.detailsForm.get('weightEstimate')!; }
  get phone()          { return this.paymentForm.get('phone')!; }

  get selectedWaste()  { return this.wasteOptions.find(o => o.value === this.wasteType.value); }
  get selectedWeight() { return this.weightOptions.find(w => w.value === this.weightEstimate.value); }

  nextStep(): void {
    if (this.currentStep() === 1) {
      this.detailsForm.markAllAsTouched();
      if (this.detailsForm.invalid) return;
    }
    if (this.currentStep() < this.totalSteps) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  selectWaste(v: WasteType) { this.wasteType.setValue(v); }
  selectWeight(v: number)   { this.weightEstimate.setValue(v); }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.imagePreview.set(dataUrl);
      this.detailsForm.patchValue({ imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.detailsForm.patchValue({ imageUrl: '' });
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) { this.locationError.set('Geolocation not supported.'); return; }
    this.locating.set(true);
    this.locationError.set('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`).subscribe({
          next: r => { this.detailsForm.patchValue({ address: r.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }); this.locating.set(false); },
          error: () => { this.detailsForm.patchValue({ address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }); this.locating.set(false); }
        });
      },
      err => {
        const msgs: Record<number, string> = { 1: 'Location access denied.', 2: 'Could not determine location.', 3: 'Location timed out.' };
        this.locationError.set(msgs[err.code] ?? 'Location unavailable.');
        this.locating.set(false);
      },
      { timeout: 10000 }
    );
  }

  confirmAndPay(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const userId = this.auth.currentUser()?.id ?? '';
    this.pickups.createPickup(userId, { ...this.detailsForm.value, amount: this.amount() }).subscribe({
      next: pickup => { this.createdPickupId.set(pickup.id); this.loading.set(false); this.currentStep.set(4); },
      error: err => { this.errorMessage.set(err?.error?.detail ?? 'Failed to create pickup.'); this.loading.set(false); }
    });
  }

  initiatePayment(): void {
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    this.paymentStatus.set('sending');
    this.errorMessage.set('');
    this.payment.initiatePayment({ pickupId: this.createdPickupId(), phone: this.phone.value, amount: this.amount() }).subscribe({
      next: res => { this.checkoutRequestId.set(res.checkoutRequestId); this.paymentMessage.set(res.message); this.paymentStatus.set('waiting'); this.startPolling(); },
      error: err => { this.paymentStatus.set('failed'); this.errorMessage.set(err?.error?.detail ?? 'Failed to initiate payment.'); }
    });
  }

  private startPolling(): void {
    this.pollCount.set(0);
    this.pollSub = interval(2000).pipe(
      switchMap(() => this.payment.checkStatus(this.checkoutRequestId())),
      takeWhile(() => this.paymentStatus() === 'waiting')
    ).subscribe({
      next: res => {
        this.pollCount.update(n => n + 1);
        if (res.status === 'PAID') {
          this.paymentStatus.set('paid');
          this.pollSub?.unsubscribe();
          setTimeout(() => this.router.navigate(['/household/dashboard'], { queryParams: { booked: 'true' } }), 2500);
        } else if (res.status === 'FAILED' || this.pollCount() > 30) {
          this.paymentStatus.set('failed');
          this.paymentMessage.set('Payment not completed. Please retry.');
          this.pollSub?.unsubscribe();
        }
      }
    });
  }

  retryPayment(): void {
    this.paymentStatus.set('idle');
    this.paymentMessage.set('');
    this.errorMessage.set('');
  }

  ngOnDestroy(): void { this.pollSub?.unsubscribe(); }
}