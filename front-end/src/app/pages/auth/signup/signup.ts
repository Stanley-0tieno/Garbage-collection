import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/api/auth.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s\-()]{7,15}$/)]],
    role: ['household' as UserRole, Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nationalId: [''],
    vehicleNumberPlate: ['']
  });

  constructor() {
    this.form.get('role')?.valueChanges.subscribe(role => {
      const nationalIdCtrl = this.form.get('nationalId');
      const vehicleCtrl = this.form.get('vehicleNumberPlate');

      if (role === 'collector') {
        nationalIdCtrl?.setValidators([Validators.required]);
        vehicleCtrl?.setValidators([Validators.required]);
      } else {
        nationalIdCtrl?.clearValidators();
        vehicleCtrl?.clearValidators();
      }

      nationalIdCtrl?.updateValueAndValidity();
      vehicleCtrl?.updateValueAndValidity();
    });
  }

  get firstName() { return this.form.get('firstName')!; }
  get lastName() { return this.form.get('lastName')!; }
  get email() { return this.form.get('email')!; }
  get phone() { return this.form.get('phone')!; }
  get role() { return this.form.get('role')!; }
  get password() { return this.form.get('password')!; }
  get nationalId() { return this.form.get('nationalId')!; }
  get vehicleNumberPlate() { return this.form.get('vehicleNumberPlate')!; }

  togglePassword() { this.showPassword.update(v => !v); }

  selectRole(r: UserRole) { this.role.setValue(r); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.signup(this.form.value).subscribe({
      error: err => {
        // FastAPI puts error text in `detail`, not `message`
        const msg = err?.error?.detail
          ?? err?.error?.message
          ?? 'Something went wrong. Please try again.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }
}