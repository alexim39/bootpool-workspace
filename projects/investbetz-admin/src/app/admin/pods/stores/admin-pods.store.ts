import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminPod, SettlementCheckResult, ReserveConsumption } from '../../services';
import { PageEvent } from '@angular/material/paginator';

@Injectable({ providedIn: 'root' })
export class AdminPodsStore {
  private admin = inject(AdminService);

  readonly pods = signal<AdminPod[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly selectedPod = signal<AdminPod | null>(null);
  readonly detailDialogPod = signal<AdminPod | null>(null);
  readonly showCreateForm = signal(false);
  readonly editPodTarget = signal<AdminPod | null>(null);
  readonly settleTarget = signal<AdminPod | null>(null);
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly reserve = signal<ReserveConsumption | null>(null);
  readonly syncResult = signal<{
    success: boolean; created: number; skipped: number;
    details: string[]; errors: string[]; apiLog: string[]; successes: Array<{ fixtureId: number; homeTeam: string; awayTeam: string; pods: number }>;
  } | null>(null);
  readonly checkingSettle = signal(false);
  readonly settleCheck = signal<SettlementCheckResult | null>(null);
  readonly settlingAll = signal(false);
  readonly settleAllResult = signal<{ settled: number; disputed: number; stuck: number; errors: string[]; results: SettlementCheckResult[] } | null>(null);
  readonly disputedPods = signal<AdminPod[]>([]);
  readonly showDisputedPanel = signal(false);
  readonly resolveTarget = signal<{ pod: AdminPod; result: string; note: string } | null>(null);
  readonly stuckPods = signal<AdminPod[]>([]);
  readonly showStuckPanel = signal(false);
  readonly batchResolveTarget = signal<{ podIds: string[]; result: string; note: string } | null>(null);
  readonly selectedDisputedIds = signal<Set<string>>(new Set());
  readonly activeTab = signal<'active' | 'past' | 'disputed'>('active');

  readonly draftCount = computed(() => this.pods().filter(p => p.status === 'draft').length);
  readonly publishedCount = computed(() => this.pods().filter(p => p.status === 'published').length);
  readonly activeCount = computed(() => this.pods().filter(p => p.status === 'active').length);
  readonly settledCount = computed(() => this.pods().filter(p => p.status === 'settled').length);
  readonly cancelledCount = computed(() => this.pods().filter(p => p.status === 'cancelled').length);
  readonly activePodsCount = computed(() => this.activeCount());
  readonly pastPodsCount = computed(() => this.settledCount() + this.cancelledCount());
  readonly disputedCount = computed(() => this.pods().filter(p => p.settlementStatus === 'disputed').length);

  readonly tabPods = computed(() => {
    if (this.activeTab() === 'active') {
      return this.pods().filter(p => ['draft', 'published', 'active'].includes(p.status));
    }
    if (this.activeTab() === 'past') {
      return this.pods().filter(p => ['settled', 'cancelled'].includes(p.status));
    }
    return this.pods();
  });

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadPods();
    });
  }

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
    this.search$.next(q);
  }

  setStatusFilter(s: string) {
    this.statusFilter.set(s);
  }

  setDateFrom(d: string) {
    this.dateFrom.set(d);
  }

  setDateTo(d: string) {
    this.dateTo.set(d);
  }

  clearDates() {
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  loadPods() {
    this.loading.set(true);
    this.admin.getPods({
      page: this.page(), limit: this.limit(), status: this.statusFilter() || undefined,
      search: this.searchQuery() || undefined, dateFrom: this.dateFrom() || undefined, dateTo: this.dateTo() || undefined
    }).subscribe(res => {
      if (res.success) {
        this.pods.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.limit.set(res.data.limit);
        this.totalPages.set(res.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  loadReserve() {
    this.admin.getReserveConsumption().subscribe(res => {
      if (res.success) this.reserve.set(res.data);
    });
  }

  onPageChange(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.loadPods();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadPods();
  }

  selectAndFetch(p: AdminPod) {
    this.admin.getPod(p.id).subscribe(res => {
      if (res.success) this.selectedPod.set(res.data);
    });
  }

  viewPodDialog(p: AdminPod) {
    this.admin.getPod(p.id).subscribe(res => {
      if (res.success) this.detailDialogPod.set(res.data);
    });
  }

  closeDetailDialog() {
    this.detailDialogPod.set(null);
  }

  openCreateForm() {
    this.showCreateForm.set(true);
    this.editPodTarget.set(null);
  }

  closeCreateForm() {
    this.showCreateForm.set(false);
    this.editPodTarget.set(null);
  }

  editPod(p: AdminPod) {
    this.admin.getPod(p.id).subscribe(res => {
      if (res.success) {
        this.editPodTarget.set(res.data);
        this.showCreateForm.set(true);
      }
    });
  }

  publishPod(id: string) {
    this.admin.publishPod(id).subscribe(() => {
      this.selectedPod.set(null);
      this.detailDialogPod.set(null);
      this.loadPods();
    });
  }

  activatePod(id: string) {
    this.admin.activatePod(id).subscribe(() => {
      this.selectedPod.set(null);
      this.detailDialogPod.set(null);
      this.loadPods();
    });
  }

  startSettle() {
    this.settleTarget.set(this.selectedPod());
  }

  confirmSettle(result: string) {
    const id = this.selectedPod()?.id || this.settleTarget()?.id;
    if (!id) return;
    this.admin.settlePod(id, result).subscribe(() => {
      this.settleTarget.set(null);
      this.selectedPod.set(null);
      this.loadPods();
    });
  }

  cancelSettle() {
    this.settleTarget.set(null);
  }

  cancelPod(id: string) {
    this.admin.cancelPod(id).subscribe(() => {
      this.selectedPod.set(null);
      this.detailDialogPod.set(null);
      this.loadPods();
    });
  }

  syncFromApi() {
    this.syncing.set(true);
    this.syncResult.set(null);
    this.admin.syncPods().subscribe({
      next: res => {
        this.syncResult.set(res);
        if (res.created > 0) this.loadPods();
        this.syncing.set(false);
      },
      error: () => {
        this.syncResult.set({ success: false, created: 0, skipped: 0, details: [], errors: ['Failed to connect to sync service'], apiLog: [], successes: [] });
        this.syncing.set(false);
      }
    });
  }

  dismissSyncResult() {
    this.syncResult.set(null);
  }

  aiCheckSettle() {
    const pod = this.selectedPod();
    if (!pod) return;
    this.checkingSettle.set(true);
    this.settleCheck.set(null);
    this.admin.aiSettleCheck(pod.id).subscribe({
      next: res => {
        this.settleCheck.set(res.data);
        this.checkingSettle.set(false);
      },
      error: () => { this.checkingSettle.set(false); }
    });
  }

  confirmAiSettle(result: string) {
    const pod = this.selectedPod();
    const check = this.settleCheck();
    if (!pod || !check) return;
    this.admin.aiSettlePod(pod.id, result, check.reasoning).subscribe({
      next: () => {
        this.settleCheck.set(null);
        this.selectedPod.set(null);
        this.loadPods();
      }
    });
  }

  dismissSettleCheck() {
    this.settleCheck.set(null);
  }

  aiSettleAll() {
    this.settlingAll.set(true);
    this.settleAllResult.set(null);
    this.admin.aiSettleAll().subscribe({
      next: res => {
        this.settleAllResult.set(res);
        this.settlingAll.set(false);
        if (res.settled > 0) this.loadPods();
      },
      error: () => { this.settlingAll.set(false); }
    });
  }

  dismissSettleAllResult() {
    this.settleAllResult.set(null);
  }

  onPodSaved() {
    this.loadPods();
    this.showCreateForm.set(false);
    this.editPodTarget.set(null);
  }

  loadDisputed() {
    this.admin.listDisputedSettlements().subscribe(res => {
      if (res.success) {
        this.disputedPods.set(res.data);
        this.showDisputedPanel.set(true);
      }
    });
  }

  dismissDisputedPanel() {
    this.showDisputedPanel.set(false);
    this.disputedPods.set([]);
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
    this.admin.resolveDispute(t.pod._id || t.pod.id, t.result, t.note.trim()).subscribe({
      next: () => {
        this.resolveTarget.set(null);
        this.loadDisputed();
        this.loadPods();
      },
      error: (err: any) => console.error('Resolve dispute failed:', err)
    });
  }

  cancelResolveDispute() {
    this.resolveTarget.set(null);
  }

  loadStuck() {
    this.admin.listStuckPods().subscribe(res => {
      if (res.success) {
        this.stuckPods.set(res.data);
        this.showStuckPanel.set(true);
      }
    });
  }

  dismissStuckPanel() {
    this.showStuckPanel.set(false);
    this.stuckPods.set([]);
  }

  selectPodAndSettle(p: AdminPod) {
    this.showStuckPanel.set(false);
    this.stuckPods.set([]);
    this.selectAndFetch(p);
  }

  toggleDisputedSelection(id: string) {
    this.selectedDisputedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  startBatchResolve() {
    const podIds = Array.from(this.selectedDisputedIds());
    if (podIds.length === 0) return;
    this.batchResolveTarget.set({ podIds, result: '', note: '' });
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
    this.admin.batchResolveDisputes(t.podIds, t.result, t.note.trim()).subscribe({
      next: () => {
        this.batchResolveTarget.set(null);
        this.selectedDisputedIds.set(new Set());
        this.loadDisputed();
        this.loadPods();
      },
      error: (err) => console.error('Batch resolve failed:', err)
    });
  }

  cancelBatchResolve() {
    this.batchResolveTarget.set(null);
  }

  switchTab(tab: 'active' | 'past' | 'disputed') {
    this.activeTab.set(tab);
    this.statusFilter.set('');
    this.page.set(1);
    if (tab === 'disputed') this.loadDisputed();
    this.loadPods();
  }
}
