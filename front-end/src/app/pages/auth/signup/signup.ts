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
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  loading       = signal(false);
  errorMessage  = signal('');
  showPassword  = signal(false);

  form: FormGroup = this.fb.group({
    firstName:         ['', [Validators.required, Validators.minLength(2)]],
    lastName:          ['', [Validators.required, Validators.minLength(2)]],
    email:             ['', [Validators.required, Validators.email]],
    phone:             ['', [Validators.required, Validators.pattern(/^[+\d\s\-()]{7,15}$/)]],
    role:              ['household' as UserRole, Validators.required],
    password:          ['', [Validators.required, Validators.minLength(6)]],
    // Household only
    nationalId:        [''],
    // Collector only
    businessRegNumber: [''],
    vehicleNumberPlate:[''],
  });

  constructor() {
    this.form.get('role')?.valueChanges.subscribe(role => {
      const nationalIdCtrl        = this.form.get('nationalId');
      const businessRegCtrl       = this.form.get('businessRegNumber');
      const vehicleCtrl           = this.form.get('vehicleNumberPlate');

      // Reset all conditional validators first
      nationalIdCtrl?.clearValidators();
      businessRegCtrl?.clearValidators();
      vehicleCtrl?.clearValidators();

      if (role === 'household') {
        nationalIdCtrl?.setValidators([Validators.required]);
      } else if (role === 'collector') {
        businessRegCtrl?.setValidators([Validators.required]);
        vehicleCtrl?.setValidators([Validators.required]);
      }

      nationalIdCtrl?.updateValueAndValidity();
      businessRegCtrl?.updateValueAndValidity();
      vehicleCtrl?.updateValueAndValidity();
    });

    // Trigger initial validator setup for default role (household)
    this.form.get('role')?.setValue('household');
  }

  get firstName()          { return this.form.get('firstName')!; }
  get lastName()           { return this.form.get('lastName')!; }
  get email()              { return this.form.get('email')!; }
  get phone()              { return this.form.get('phone')!; }
  get role()               { return this.form.get('role')!; }
  get password()           { return this.form.get('password')!; }
  get nationalId()         { return this.form.get('nationalId')!; }
  get businessRegNumber()  { return this.form.get('businessRegNumber')!; }
  get vehicleNumberPlate() { return this.form.get('vehicleNumberPlate')!; }

  togglePassword() { this.showPassword.update(v => !v); }
  selectRole(r: UserRole) { this.role.setValue(r); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    // Build payload — only send fields relevant to the chosen role
    const raw = this.form.value;
    const payload: any = {
      firstName: raw.firstName,
      lastName:  raw.lastName,
      email:     raw.email,
      phone:     raw.phone,
      role:      raw.role,
      password:  raw.password,
    };

    if (raw.role === 'household') {
      payload.nationalId = raw.nationalId;
    } else if (raw.role === 'collector') {
      payload.businessRegNumber  = raw.businessRegNumber;
      payload.vehicleNumberPlate = raw.vehicleNumberPlate;
    }

    this.auth.signup(payload).subscribe({
      error: err => {
        const msg = err?.error?.detail ?? err?.error?.message ?? 'Something went wrong. Please try again.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }
}