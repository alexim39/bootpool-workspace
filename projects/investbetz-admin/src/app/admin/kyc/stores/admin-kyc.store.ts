import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminService, AdminUser, KycReviewResult } from '../../services';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface KycUser extends AdminUser {
  kycType?: string;
  kycNumber?: string;
  kycSubmittedAt?: string;
  kycReviewNote?: string;
  kycData?: { bvnVerifiedName?: string; ninVerifiedName?: string };
}

@Injectable({ providedIn: 'root' })
export class AdminKycStore {
  private admin = inject(AdminService);
  private search$ = new Subject<string>();

  readonly items = signal<KycUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly selectedUser = signal<KycUser | null>(null);
  readonly showRejectForm = signal(false);
  readonly rejectNote = signal('');
  readonly loading = signal(false);
  readonly reviewing = signal(false);
  readonly kycReview = signal<KycReviewResult | null>(null);

  readonly columns = ['name', 'phone', 'type', 'status', 'submitted', 'actions'];

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.admin.getUsers({ page: this.page(), limit: this.limit(), search: this.searchQuery() || undefined })
      .subscribe(res => {
        if (res.success) {
          const allUsers = res.data.items as KycUser[];
          const kycUsers = allUsers.filter(u => u.kycType || u.kycNumber || u.kycSubmittedAt);
          const sf = this.statusFilter();
          if (sf === 'verified') {
            this.items.set(kycUsers.filter(u => u.kycVerified));
          } else if (sf === 'pending') {
            this.items.set(kycUsers.filter(u => !u.kycVerified));
          } else {
            this.items.set(kycUsers);
          }
          this.total.set(res.data.total);
          this.page.set(res.data.page);
          this.limit.set(res.data.limit);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      });
  }

  onSearchInput() {
    this.search$.next(this.searchQuery());
  }

  onFilterChange() {
    this.page.set(1);
    this.load();
  }

  onPageChange(index: number, pageSize: number) {
    this.page.set(index + 1);
    this.limit.set(pageSize);
    this.load();
  }

  selectUser(u: KycUser) {
    this.showRejectForm.set(false);
    this.rejectNote.set('');
    this.admin.getUser(u._id || u.id).subscribe((res: any) => {
      if (res.success) this.selectedUser.set(res.data?.user || res.data);
    });
  }

  closeUserDetail() {
    this.selectedUser.set(null);
  }

  verifyKyc(u: KycUser) {
    this.admin.verifyUserKyc(u._id || u.id).subscribe(() => {
      this.selectedUser.set(null);
      this.load();
    });
  }

  rejectKyc(u: KycUser) {
    this.admin.rejectUserKyc(u._id || u.id, this.rejectNote() || 'KYC documents rejected')
      .subscribe(() => {
        this.selectedUser.set(null);
        this.showRejectForm.set(false);
        this.rejectNote.set('');
        this.load();
      });
  }

  aiReview() {
    const user = this.selectedUser();
    if (!user) return;
    this.reviewing.set(true);
    this.kycReview.set(null);
    this.admin.aiKycReview(user._id || user.id).subscribe({
      next: res => {
        this.kycReview.set(res.data);
        this.reviewing.set(false);
      },
      error: () => { this.reviewing.set(false); }
    });
  }

  executeAiVerdict() {
    const user = this.selectedUser();
    const review = this.kycReview();
    if (!user || !review) return;
    const uid = user._id || user.id;
    if (review.recommendedAction === 'approve') {
      this.admin.aiKycApprove(uid).subscribe(() => {
        this.kycReview.set(null);
        this.selectedUser.set(null);
        this.load();
      });
    } else {
      this.admin.aiKycReject(uid, review.reasoning).subscribe(() => {
        this.kycReview.set(null);
        this.selectedUser.set(null);
        this.load();
      });
    }
  }
}
