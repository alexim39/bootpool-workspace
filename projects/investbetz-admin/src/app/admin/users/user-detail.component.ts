import { Component, OnInit, inject, computed, effect, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUsersStore } from './stores/admin-users.store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, UpperCasePipe, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  readonly store = inject(AdminUsersStore);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    role: ['user', Validators.required],
    status: ['active', Validators.required],
  });

  readonly user = computed(() => this.store.selectedUser()?.user || null);
  readonly wallet = computed(() => this.store.selectedUser()?.wallet || null);
  readonly saving = computed(() => this.store.saving());
  readonly activeTab = signal<'stakes' | 'referrals'>('stakes');

  setActiveTab(tab: 'stakes' | 'referrals') {
    this.activeTab.set(tab);
  }

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: null });

  readonly previewName = computed(() => {
    const name = (this.formValue()?.fullName || '').trim();
    if (name) return name;
    return this.user()?.fullName || this.user()?.phone || 'User';
  });
  readonly avatarInitial = computed(() => (this.previewName() || '?').charAt(0).toUpperCase());

  private syncEffect = effect(() => {
    const u = this.user();
    if (u && !this.form.dirty) this.patchForm(u);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.loadUser(id);
  }

  private patchForm(u: any) {
    this.form.patchValue({
      fullName: u.fullName || '',
      phone: u.phone || '',
      email: u.email || '',
      role: u.role === 'admin' ? 'admin' : 'user',
      status: u.isSuspended ? 'suspended' : 'active',
    });
    this.form.markAsPristine();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const v = this.form.value;
    this.store.updateUser(id, {
      fullName: (v.fullName || '').trim(),
      phone: (v.phone || '').trim(),
      email: (v.email || '').trim() || undefined,
      role: (v.role as 'user' | 'admin'),
      isSuspended: v.status === 'suspended',
    }).subscribe({
      next: (res) => {
        this.form.markAsPristine();
        this.snackBar.open(res.message || 'User updated successfully', 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to update user', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  reset() {
    const u = this.user();
    if (u) this.patchForm(u);
  }

  toggleStatus() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.toggleUserById(id);
  }

  toggleAffiliate() {
    const id = this.route.snapshot.paramMap.get('id');
    const u = this.user();
    if (id && u) {
      this.store.updateUser(id, { isAffiliate: !u.isAffiliate }).subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Affiliate status updated', 'OK', { duration: 3000, panelClass: 'snack-success' });
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Failed to update affiliate status', 'OK', { duration: 4000, panelClass: 'snack-error' });
        },
      });
    }
  }

  verifyKyc() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.verifyUserKycById(id);
  }

  deleteUser() {
    const id = this.route.snapshot.paramMap.get('id');
    const u = this.user();
    if (!id || !u) return;
    if (u.role === 'admin') {
      this.snackBar.open('Admin accounts cannot be deleted', 'OK', { duration: 4000, panelClass: 'snack-error' });
      return;
    }
    const confirmed = window.confirm(
      `Permanently delete ${u.fullName || u.phone}?\n\nThis deactivates the account, anonymizes all personal data and revokes every session. This cannot be undone.`
    );
    if (confirmed) this.store.deleteUserById(id);
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }

  isAccumulator(s: any): boolean {
    return !!(s.items && s.items.length > 1);
  }
}
