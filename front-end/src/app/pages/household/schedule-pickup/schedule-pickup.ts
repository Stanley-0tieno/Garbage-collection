import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/api/auth.service';
import { PickupService } from '../../../services/api/pickup.service';
import { WasteType } from '../../../models/pickup.model';

interface WasteOption {
  value: WasteType;
  label: string;
  icon: string;
  desc: string;
}

@Component({
  selector: 'app-schedule-pickup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './schedule-pickup.html',
  styleUrl: './schedule-pickup.scss'
})
export class SchedulePickupComponent {
  private fb      = inject(FormBuilder);
  private auth    = inject(AuthService);
  private pickups = inject(PickupService);
  private router  = inject(Router);

  loading       = signal(false);
  errorMessage  = signal('');
  successMessage = signal('');

  readonly wasteOptions: WasteOption[] = [
    { value: 'general',    label: 'General Waste',  icon: '🗑️',  desc: 'Everyday household waste' },
    { value: 'recyclable', label: 'Recyclable',     icon: '♻️',  desc: 'Paper, plastic, glass, metal' },
    { value: 'organic',    label: 'Organic',        icon: '🌿',  desc: 'Food scraps, garden waste' },
    { value: 'electronic', label: 'Electronic',     icon: '💻',  desc: 'Old electronics & gadgets' },
    { value: 'hazardous',  label: 'Hazardous',      icon: '⚠️',  desc: 'Chemicals, batteries, paint' },
  ];

  // Min date = tomorrow
  readonly minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  form: FormGroup = this.fb.group({
    wasteType: ['', Validators.required],
    date:      ['', Validators.required],
    address:   ['', [Validators.required, Validators.minLength(5)]],
    notes:     ['']
  });

  get wasteType() { return this.form.get('wasteType')!; }
  get date()      { return this.form.get('date')!; }
  get address()   { return this.form.get('address')!; }

  selectWaste(value: WasteType) { this.wasteType.setValue(value); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    const userId = this.auth.currentUser()?.id ?? '';
    this.pickups.createPickup(userId, this.form.value).subscribe({
      next: () => {
        this.successMessage.set('Pickup scheduled successfully!');
        setTimeout(() => this.router.navigate(['/household/dashboard']), 1500);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to schedule pickup.');
        this.loading.set(false);
      }
    });
  }
}