import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '.././../../services/api/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  loading      = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  togglePassword() { this.showPassword.update(v => !v); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.value).subscribe({
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Invalid email or password.');
        this.loading.set(false);
      }
    });
  }
}