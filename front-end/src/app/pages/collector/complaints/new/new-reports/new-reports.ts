import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComplaintService } from '../../../../../services/api/complaint.service';

@Component({
  selector: 'app-new-report',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './new-reports.html',
  styleUrl: './new-reports.scss'
})
export class NewReportComponent {
  private fb         = inject(FormBuilder);
  private complaints = inject(ComplaintService);
  private router     = inject(Router);

  loading      = signal(false);
  errorMessage = signal('');

  readonly issueTypes = [
    { value: 'customer_unavailable', label: '🚪 Customer Unavailable', desc: 'No one was home or reachable'  },
    { value: 'wrong_address',        label: '📍 Wrong Address',         desc: 'Location was incorrect'        },
    { value: 'safety_issue',         label: '⚠️ Safety Issue',          desc: 'Unsafe conditions at pickup'   },
    { value: 'other',                label: '💬 Other',                  desc: 'Something else happened'      },
  ];

  form: FormGroup = this.fb.group({
    issueType: ['', Validators.required],
    pickupId:  [''],
    message:   ['', [Validators.required, Validators.minLength(10)]],
  });

  get issueType() { return this.form.get('issueType')!; }
  get message()   { return this.form.get('message')!; }

  selectIssue(value: string): void {
    this.form.patchValue({ issueType: value });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    this.complaints.createComplaint(this.form.value).subscribe({
      next: () => this.router.navigate(['/collector/complaints']),
      error: err => {
        this.errorMessage.set(err?.error?.detail ?? 'Failed to submit report. Please try again.');
        this.loading.set(false);
      }
    });
  }
}