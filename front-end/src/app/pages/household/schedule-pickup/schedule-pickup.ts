import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { PaymentService } from '../../../services/api/payment.service';
import { WasteType, WASTE_PRICES_PER_KG } from '../../../models/pickup.model';

export interface WasteOption {
  value: WasteType;
  label: string;
  icon: string;
  desc: string;
  pricePerKg: number;
}

@Component({
  selector: 'app-schedule-pickup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './schedule-pickup.html',
  styleUrl: './schedule-pickup.scss'
})
export class SchedulePickupComponent implements OnDestroy {
  private fb       = inject(FormBuilder);
  private auth     = inject(AuthService);
  private pickups  = inject(PickupService);
  private payment  = inject(PaymentService);
  private router   = inject(Router);
  private http     = inject(HttpClient);

  currentStep = signal(1);
  totalSteps  = 3;

  loading       = signal(false);
  locating      = signal(false);
  locationError = signal('');
  errorMessage  = signal('');
  imagePreview  = signal<string | null>(null);
  createdPickupId = signal('');

  // Waste options with predefined system prices
  readonly wasteOptions: WasteOption[] = [
    { value: 'general',    label: 'General Waste', icon: '🗑️', desc: 'Everyday household waste',      pricePerKg: WASTE_PRICES_PER_KG['general'] },
    { value: 'recyclable', label: 'Recyclable',    icon: '♻️', desc: 'Paper, plastic, glass, metal',  pricePerKg: WASTE_PRICES_PER_KG['recyclable'] },
    { value: 'organic',    label: 'Organic',        icon: '🌿', desc: 'Food scraps, garden waste',     pricePerKg: WASTE_PRICES_PER_KG['organic'] },
    { value: 'electronic', label: 'Electronic',     icon: '💻', desc: 'Old electronics & gadgets',     pricePerKg: WASTE_PRICES_PER_KG['electronic'] },
    { value: 'hazardous',  label: 'Hazardous',      icon: '⚠️', desc: 'Chemicals, batteries, paint',  pricePerKg: WASTE_PRICES_PER_KG['hazardous'] },
  ];

  // NOTE: No minDate / date field — date is assigned by the collector
  detailsForm: FormGroup = this.fb.group({
    wasteType: [[] as WasteType[], [Validators.required, Validators.minLength(1)]],
    address:   ['', [Validators.required, Validators.minLength(5)]],
    notes:     [''],
    imageUrl:  ['']
  });

  get wasteType() { return this.detailsForm.get('wasteType')!; }
  get address()   { return this.detailsForm.get('address')!; }

  get selectedWastes() {
    return this.wasteOptions.filter(o => (this.wasteType.value as WasteType[]).includes(o.value));
  }

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

  selectWaste(v: WasteType) {
    const current = this.wasteType.value as WasteType[];
    if (current.includes(v)) {
      this.wasteType.setValue(current.filter(i => i !== v));
    } else {
      this.wasteType.setValue([...current, v]);
    }
  }

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
        this.http.get<any>(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        ).subscribe({
          next:  r => { this.detailsForm.patchValue({ address: r.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }); this.locating.set(false); },
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

  createPickup(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const userId = this.auth.currentUser()?.id ?? '';
    // Only send fields relevant to CreatePickupRequest (no date)
    const { wasteType, address, notes, imageUrl } = this.detailsForm.value;
    this.pickups.createPickup(userId, { wasteType, address, notes, imageUrl }).subscribe({
      next: pickup => {
        this.createdPickupId.set(pickup.id);
        this.loading.set(false);
        this.router.navigate(['/household/dashboard'], { queryParams: { booked: 'true' } });
      },
      error: err => {
        this.errorMessage.set(err?.error?.detail ?? 'Failed to create pickup.');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {}
}