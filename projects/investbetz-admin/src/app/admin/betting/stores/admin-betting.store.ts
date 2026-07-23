import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminPod, SettlementCheckResult } from '../../services';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminBettingStore {
  private admin = inject(AdminService);
  private http = inject(HttpClient);

  readonly pods = signal<AdminPod[]>([]);
  readonly sports = signal<string[]>([]);
  readonly loading = signal(false);
  readonly detailPod = signal<AdminPod | null>(null);
  readonly togglingIds = signal<Set<string>>(new Set());

  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);

  readonly searchTerm = signal('');
  readonly sportFilter = signal('');
  readonly bookedFilter = signal('');
  readonly listStatus = signal('all');
  readonly sortBy = signal('stakingClosesAt');
  readonly sortOrder = signal<'desc' | 'asc'>('desc');

  readonly selectedIds = signal<Set<string>>(new Set());
  readonly batchProcessing = signal(false);
  readonly jumpPage = signal<number | null>(null);

  readonly settlingAll = signal(false);
  readonly checkingSettle = signal(false);
  readonly settleCheck = signal<SettlementCheckResult | null>(null);
  readonly settleTarget = signal<AdminPod | null>(null);
  readonly settleAllResult = signal<any>(null);
  readonly showDisputedPanel = signal(false);
  readonly disputedPods = signal<AdminPod[]>([]);
  readonly selectedDisputedIds = signal<Set<string>>(new Set());
  readonly resolveTarget = signal<{ pod: AdminPod; result: string; note: string } | null>(null);
  readonly batchResolveTarget = signal<{ podIds: string[]; result: string; note: string } | null>(null);
  readonly showStuckPanel = signal(false);
  readonly stuckPods = signal<AdminPod[]>([]);

  readonly bookedCount = computed(() => this.pods().filter(p => p.bookedExternally).length);
  readonly totalExposure = computed(() => this.pods().reduce((sum, p) => sum + (p.currentExposure || 0), 0));
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allSelected = computed(() => this.pods().length > 0 && this.pods().every(p => this.selectedIds().has(p._id || p.id)));
  readonly someSelected = computed(() => this.selectedIds().size > 0 && !this.allSelected());
  readonly allSelectedBooked = computed(() => {
    if (this.selectedIds().size === 0) return false;
    return [...this.selectedIds()].every(id => {
      const p = this.pods().find(x => (x._id || x.id) === id);
      return p?.bookedExternally;
    });
  });

  readonly visiblePages = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadPods();
    });
  }

  onSearchChange() {
    this.page.set(1);
    this.search$.next(this.searchTerm());
  }

  clearSearch() {
    this.searchTerm.set('');
    this.page.set(1);
    this.loadPods();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadPods();
  }

  toggleSort(field: string) {
    if (this.sortBy() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set(field === 'stakingClosesAt' ? 'desc' : 'asc');
    }
    this.loadPods();
  }

  loadPods() {
    this.loading.set(true);
    this.detailPod.set(null);
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: String(this.limit())
    });
    if (this.searchTerm()) params.set('search', this.searchTerm());
    if (this.sportFilter()) params.set('sport', this.sportFilter());
    if (this.bookedFilter()) params.set('booked', this.bookedFilter());
    if (this.sortBy()) params.set('sortBy', this.sortBy());
    if (this.sortOrder()) params.set('sortOrder', this.sortOrder());
    if (this.listStatus()) params.set('listStatus', this.listStatus());

    this.http.get<any>(`${environment.apiUrl}/admin/pods/ready-for-betting?${params}`).subscribe(res => {
      if (res.success) {
        this.pods.set(res.data.items.map((p: any) => ({ ...p, id: p._id || p.id })));
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.totalPages.set(res.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  loadSports() {
    this.http.get<{ success: boolean; data: string[] }>(`${environment.apiUrl}/pods/sports`).subscribe(res => {
      if (res.success) this.sports.set(res.data);
    });
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadPods();
  }

  jumpToPage() {
    const jp = this.jumpPage();
    if (jp && jp >= 1 && jp <= this.totalPages()) {
      this.goTo(jp);
    }
    this.jumpPage.set(null);
  }

  toggleSelect(pod: AdminPod) {
    const id = pod._id || pod.id;
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(new Set(this.pods().map(p => p._id || p.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  batchToggleBooked() {
    if (this.batchProcessing() || this.selectedIds().size === 0) return;
    this.batchProcessing.set(true);
    const ids = [...this.selectedIds()];
    let completed = 0;
    ids.forEach(id => {
      this.togglingIds.update(set => { const n = new Set(set); n.add(id); return n; });
      this.admin.toggleExternalBooking(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.pods.update(pods => pods.map(p => (p._id || p.id) === id ? { ...p, ...res.data } : p));
          }
          this.togglingIds.update(set => { const n = new Set(set); n.delete(id); return n; });
          completed++;
          if (completed === ids.length) {
            this.batchProcessing.set(false);
            this.selectedIds.set(new Set());
          }
        },
        error: () => {
          this.togglingIds.update(set => { const n = new Set(set); n.delete(id); return n; });
          completed++;
          if (completed === ids.length) {
            this.batchProcessing.set(false);
          }
        }
      });
    });
  }

  toggleBooked(pod: AdminPod) {
    const id = pod._id || pod.id;
    if (this.togglingIds().has(id)) return;
    this.togglingIds.update(set => { const n = new Set(set); n.add(id); return n; });
    this.admin.toggleExternalBooking(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.pods.update(pods => pods.map(p => (p._id || p.id) === id ? { ...p, ...res.data } : p));
        }
        this.togglingIds.update(set => { const n = new Set(set); n.delete(id); return n; });
      },
      error: () => this.togglingIds.update(set => { const n = new Set(set); n.delete(id); return n; })
    });
  }

  openExternalBetting(pod: AdminPod) {
    this.detailPod.set(pod);
    this.settleCheck.set(null);
    this.settleTarget.set(null);
  }

  closeDetailPanel() {
    this.detailPod.set(null);
  }

  aiSettleAll() {
    this.settlingAll.set(true);
    this.settleAllResult.set(null);
    this.admin.aiSettleAll().subscribe({
      next: res => {
        if (res.success) {
          this.settleAllResult.set(res);
          this.loadPods();
        }
        this.settlingAll.set(false);
      },
      error: () => this.settlingAll.set(false)
    });
  }

  aiCheckSettle() {
    const pod = this.detailPod();
    if (!pod) return;
    this.checkingSettle.set(true);
    this.settleCheck.set(null);
    this.settleTarget.set(null);
    this.admin.aiSettleCheck(pod._id || pod.id).subscribe({
      next: res => {
        if (res.success) this.settleCheck.set(res.data);
        this.checkingSettle.set(false);
      },
      error: () => this.checkingSettle.set(false)
    });
  }

  confirmAiSettle(result: string) {
    const pod = this.detailPod();
    const check = this.settleCheck();
    if (!pod || !check) return;
    this.admin.aiSettlePod(pod._id || pod.id, result, check.reasoning).subscribe({
      next: (res) => {
        if (res.success) {
          this.detailPod.set(null);
          this.settleCheck.set(null);
          this.loadPods();
        }
      }
    });
  }

  dismissSettleCheck() {
    this.settleCheck.set(null);
  }

  startSettle() {
    const pod = this.detailPod();
    if (!pod) return;
    this.settleTarget.set(pod);
    this.settleCheck.set(null);
  }

  confirmSettle(result: string) {
    const target = this.settleTarget();
    if (!target) return;
    const id = target._id || target.id;
    this.admin.settlePod(id, result, '').subscribe({
      next: (res) => {
        if (res.success) {
          this.detailPod.set(null);
          this.settleTarget.set(null);
          this.loadPods();
        }
      },
      error: (err) => console.error('Settle request error:', err)
    });
  }

  cancelSettle() {
    this.settleTarget.set(null);
  }

  loadDisputed() {
    this.showDisputedPanel.set(true);
    this.selectedDisputedIds.set(new Set());
    this.admin.listDisputedSettlements().subscribe({
      next: res => { if (res.success) this.disputedPods.set(res.data); }
    });
  }

  dismissDisputedPanel() {
    this.showDisputedPanel.set(false);
    this.disputedPods.set([]);
  }

  toggleDisputedSelection(id: string) {
    this.selectedDisputedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  startResolveDispute(pod: AdminPod) {
    this.resolveTarget.set({ pod, result: '', note: '' });
  }

  setResolveResult(result: string) {
    this.resolveTarget.update(t => t ? { ...t, result } : null);
  }

  setResolveNote(note: string) {
    this.resolveTarget.update(t => t ? { ...t, note } : null);
  }

  confirmResolveDispute() {
    const t = this.resolveTarget();
    if (!t || !t.result || !t.note.trim()) return;
    const podId = t.pod._id || t.pod.id;
    this.admin.resolveDispute(podId, t.result, t.note).subscribe({
      next: (res) => {
        if (res.success) {
          this.disputedPods.update(pods => pods.filter(p => (p._id || p.id) !== podId));
          this.resolveTarget.set(null);
          this.loadPods();
        }
      }
    });
  }

  cancelResolveDispute() {
    this.resolveTarget.set(null);
  }

  startBatchResolve() {
    this.batchResolveTarget.set({ podIds: [...this.selectedDisputedIds()], result: '', note: '' });
  }

  setBatchResolveResult(result: string) {
    this.batchResolveTarget.update(t => t ? { ...t, result } : null);
  }

  setBatchResolveNote(note: string) {
    this.batchResolveTarget.update(t => t ? { ...t, note } : null);
  }

  confirmBatchResolve() {
    const t = this.batchResolveTarget();
    if (!t || !t.result || !t.note.trim()) return;
    this.admin.batchResolveDisputes(t.podIds, t.result, t.note).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedDisputedIds.set(new Set());
          this.batchResolveTarget.set(null);
          this.showDisputedPanel.set(false);
          this.disputedPods.set([]);
          this.loadPods();
        }
      }
    });
  }

  cancelBatchResolve() {
    this.batchResolveTarget.set(null);
  }

  loadStuck() {
    this.showStuckPanel.set(true);
    this.admin.listStuckPods().subscribe({
      next: res => { if (res.success) this.stuckPods.set(res.data); }
    });
  }

  dismissStuckPanel() {
    this.showStuckPanel.set(false);
    this.stuckPods.set([]);
  }

  selectPodAndSettle(pod: AdminPod) {
    this.showStuckPanel.set(false);
    this.stuckPods.set([]);
    this.detailPod.set(pod);
    this.settleCheck.set(null);
    this.settleTarget.set(null);
  }
}
