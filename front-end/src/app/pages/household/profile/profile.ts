import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/api/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {
  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  editing       = signal(false);
  saved         = signal(false);

  form: FormGroup = this.fb.group({
    firstName: [this.user()?.firstName ?? '', [Validators.required]],
    lastName:  [this.user()?.lastName  ?? '', [Validators.required]],
    email:     [{ value: this.user()?.email ?? '', disabled: true }],
    phone:     [this.user()?.phone ?? '', [Validators.required]],
  });

  get firstName() { return this.form.get('firstName')!; }
  get lastName()  { return this.form.get('lastName')!; }
  get phone()     { return this.form.get('phone')!; }

  startEdit()  { this.editing.set(true);  this.saved.set(false); }
  cancelEdit() { this.editing.set(false); this.form.reset({ firstName: this.user()?.firstName, lastName: this.user()?.lastName, phone: this.user()?.phone }); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    // Wire to your API when ready
    this.editing.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}