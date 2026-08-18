import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  WalletService,
  RecipientMatch,
  TransferRecord,
  TransferQuery,
} from '../../../core/services';

const TRANSFER_MIN = 500;
const TRANSFER_MAX = 5_000_000;
const TRANSFER_DAILY = 10_000_000;

export const TRANSFER_PAGE_SIZES = [25, 50, 100];

export const TRANSFER_SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'amount:desc', label: 'Amount: high to low' },
  { value: 'amount:asc', label: 'Amount: low to high' },
];

@Injectable({ providedIn: 'root' })
export class TransferStore {
  private _wallet = inject(WalletService);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);

  readonly walletService = this._wallet;
  readonly walletBalance = this._wallet.balance;
  readonly transferMin = TRANSFER_MIN;
  readonly transferMax = TRANSFER_MAX;
  readonly transferDaily = TRANSFER_DAILY;

  // ========================
  // SEND FLOW
  // ========================

  recipientSearchCtrl = new FormControl('');
  recipientResults = signal<RecipientMatch[]>([]);
  recipientSearching = signal(false);
  recipientError = signal<string | null>(null);
  recipientId = signal('');
  recipientName = signal('');
  recipientPhone = signal('');

  readonly transferForm: FormGroup;
  private readonly amountValueSignal = signal(0);
  readonly calculatedAmount = this.amountValueSignal.asReadonly();
  readonly submitting = signal(false);
  readonly lastTransfer = signal<{ amount: number; recipientName: string; reference: string } | null>(null);

  pinDigits = signal<string[]>(['', '', '', '', '', '']);
  pinError = signal<string | null>(null);

  readonly amountInsufficient = computed(() => {
    const balance = this.walletBalance().available;
    return balance > 0 && this.amountValueSignal() > balance;
  });

  readonly amountValid = computed(() => {
    const v = this.amountValueSignal();
    return v >= TRANSFER_MIN && v <= TRANSFER_MAX && !this.amountInsufficient();
  });

  readonly formReady = computed(() => !!this.recipientId() && this.amountValid());

  readonly canSubmit = computed(() => {
    return this.formReady() && this.pinDigits().every(d => d !== '') && !this.submitting();
  });

  readonly flowStep = computed(() => (this.amountValid() ? 3 : this.recipientId() ? 2 : 1));

  // ========================
  // HISTORY (server-side paginated)
  // ========================

  transfers = signal<TransferRecord[]>([]);
  historyLoading = signal(false);
  loadingMore = signal(false);
  historyError = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  limit = signal(25);
  direction = signal<'sent' | 'received' | ''>('');
  status = signal('');
  from = signal('');
  to = signal('');
  search = signal('');
  sortField = signal<'createdAt' | 'amount' | 'status'>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  selectedIds = signal<Set<string>>(new Set());

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  readonly hasMore = computed(() => this.page() < this.totalPages());
  readonly allSelected = computed(() => {
    const rows = this.transfers();
    return rows.length > 0 && rows.every(t => this.selectedIds().has(t.id));
  });
  readonly someSelected = computed(() => {
    const rows = this.transfers();
    return rows.some(t => this.selectedIds().has(t.id)) && !this.allSelected();
  });
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly hasActiveFilters = computed(() =>
    !!this.direction() || !!this.status() || !!this.from() || !!this.to() || !!this.search()
  );
  readonly activeFilterCount = computed(() =>
    [this.direction(), this.status(), this.from(), this.to(), this.search()].filter(v => !!v).length
  );

  private readonly search$ = new Subject<string>();

  constructor() {
    this.transferForm = this._fb.group({
      amount: [null, [Validators.required, Validators.min(TRANSFER_MIN)]],
      narration: ['', [Validators.maxLength(140)]]
    });

    // Debounced server-side recipient lookup
    this.recipientSearchCtrl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(term => {
        const q = (typeof term === 'string' ? term : '').trim();
        if (this.recipientId() && q === this.recipientName()) {
          return;
        }
        if (this.recipientId()) {
          this.clearRecipient();
        }
        if (!q) {
          this.recipientResults.set([]);
          this.recipientSearching.set(false);
          return;
        }
        this.recipientSearching.set(true);
        this.recipientError.set(null);
        this._wallet.resolveRecipient(q).subscribe({
          next: (res) => {
            this.recipientSearching.set(false);
            this.recipientResults.set(res.success ? res.data : []);
          },
          error: () => {
            this.recipientSearching.set(false);
            this.recipientResults.set([]);
          }
        });
      });

    this.transferForm.get('amount')?.valueChanges.subscribe(v => {
      this.amountValueSignal.set(Number(v) || 0);
      this.recheckAmountError();
    });

    effect(() => { this.walletBalance(); this.recheckAmountError(); });

    // Debounced history search (300–500ms per spec)
    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(term => {
      this.setFilters({ search: term });
    });
  }

  init() {
    this._wallet.fetchBalance();
    this.loadHistory();
  }

  // ========================
  // SEND FLOW ACTIONS
  // ========================

  selectRecipient(recipient: RecipientMatch) {
    this.recipientId.set(recipient.id);
    this.recipientName.set(recipient.fullName || '');
    this.recipientPhone.set(recipient.phone || '');
    this.recipientSearchCtrl.setValue(recipient.fullName);
    this.recipientResults.set([]);
    this.recipientError.set(null);
  }

  clearRecipient() {
    this.recipientId.set('');
    this.recipientName.set('');
    this.recipientPhone.set('');
    this.recipientResults.set([]);
    this.recipientError.set(null);
  }

  setAmount(amt: number) {
    this.transferForm.patchValue({ amount: amt });
  }

  onPinInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    if (!val) return;
    const newPins = [...this.pinDigits()];
    newPins[index] = val;
    this.pinDigits.set(newPins);
    this.pinError.set(null);
    if (index < 5 && val) {
      const next = document.getElementById('tpin-' + (index + 1));
      next?.focus();
    }
  }

  onPinKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const newPins = [...this.pinDigits()];
      if (newPins[index]) {
        newPins[index] = '';
        this.pinDigits.set(newPins);
      } else if (index > 0) {
        newPins[index - 1] = '';
        this.pinDigits.set(newPins);
        const prev = document.getElementById('tpin-' + (index - 1));
        prev?.focus();
      }
      this.pinError.set(null);
      event.preventDefault();
    }
  }

  submitTransfer(onSuccessMessage?: (msg: string) => void) {
    if (!this.canSubmit()) return;
    this.pinError.set(null);
    this.submitting.set(true);
    const pin = this.pinDigits().join('');
    const amount = Number(this.transferForm.get('amount')?.value || 0);
    const narration = String(this.transferForm.get('narration')?.value || '').trim();

    this._wallet.initiateTransfer({
      recipientId: this.recipientId(),
      amount,
      pin,
      narration: narration || undefined
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.lastTransfer.set({
            amount,
            recipientName: this.recipientName() || this.recipientPhone(),
            reference: res.reference || ''
          });
          this.resetForm();
          this._wallet.fetchBalance();
          this.loadHistory();
          if (onSuccessMessage) {
            onSuccessMessage(`Transfer of ${this._wallet.formatAmount(amount)} to ${this.recipientName()} successful!`);
          }
          setTimeout(() => this._router.navigate(['/wallet']), 2500);
        } else {
          this.pinError.set(res.message || 'Transfer failed');
          this.resetPin();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.pinError.set(err.error?.message || 'Transfer failed. Try again.');
        this.resetPin();
      }
    });
  }

  private resetForm() {
    this.transferForm.reset();
    this.recipientSearchCtrl.setValue('');
    this.clearRecipient();
    this.resetPin();
  }

  private resetPin() {
    this.pinDigits.set(['', '', '', '', '', '']);
    const first = document.getElementById('tpin-0');
    first?.focus();
  }

  private recheckAmountError() {
    const ctrl = this.transferForm.get('amount');
    if (!ctrl) return;
    if (this.amountInsufficient()) {
      ctrl.setErrors({ ...(ctrl.errors || {}), insufficient: true });
    } else {
      const errs = { ...(ctrl.errors || {}) };
      delete errs['insufficient'];
      ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  // ========================
  // HISTORY ACTIONS
  // ========================

  onSearchChange(value: string) {
    this.search$.next(value);
  }

  setFilters(patch: Partial<{
    direction: 'sent' | 'received' | '';
    status: string;
    from: string;
    to: string;
    search: string;
    sort: string;
    limit: number;
  }>) {
    if (patch.direction !== undefined) this.direction.set(patch.direction);
    if (patch.status !== undefined) this.status.set(patch.status);
    if (patch.from !== undefined) this.from.set(patch.from);
    if (patch.to !== undefined) this.to.set(patch.to);
    if (patch.search !== undefined) this.search.set(patch.search);
    if (patch.limit !== undefined) this.limit.set(patch.limit);
    if (patch.sort !== undefined) {
      const [field, order] = patch.sort.split(':') as ['createdAt' | 'amount' | 'status', 'asc' | 'desc'];
      this.sortField.set(field);
      this.sortOrder.set(order);
    }
    this.page.set(1);
    this.loadHistory();
  }

  clearFilters() {
    this.direction.set('');
    this.status.set('');
    this.from.set('');
    this.to.set('');
    this.search.set('');
    this.sortField.set('createdAt');
    this.sortOrder.set('desc');
    this.page.set(1);
    this.loadHistory();
  }

  loadHistory() {
    const filters = this.currentQuery();
    this.historyLoading.set(true);
    this.historyError.set(null);
    this._wallet.fetchTransfers(this.page(), this.limit(), filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.transfers.set((res.data.transfers || []).map(t => ({ ...t, id: t.id || String((t as any)._id) })));
          this.total.set(res.data.total);
        }
        this.historyLoading.set(false);
      },
      error: (err) => {
        this.historyError.set(err.error?.message || 'Failed to fetch transfers');
        this.historyLoading.set(false);
      }
    });
  }

  loadMore() {
    if (!this.hasMore() || this.loadingMore()) return;
    const nextPage = this.page() + 1;
    this.loadingMore.set(true);
    this._wallet.fetchTransfers(nextPage, this.limit(), this.currentQuery()).subscribe({
      next: (res) => {
        if (res.success) {
          this.transfers.update(list => [...list, ...(res.data.transfers || [])]);
          this.total.set(res.data.total);
          this.page.set(nextPage);
        }
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
    });
  }

  goToPage(page: number) {
    const clamped = Math.max(1, Math.min(this.totalPages(), Math.floor(page)));
    if (clamped === this.page() || this.historyLoading()) return;
    this.page.set(clamped);
    this.loadHistory();
  }

  private currentQuery(): TransferQuery {
    const query: TransferQuery = {
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
      ...(this.direction() && { direction: this.direction() as 'sent' | 'received' }),
      ...(this.status() && { status: this.status() }),
      ...(this.search() && { search: this.search() }),
      ...(this.from() && { from: this.from() }),
      ...(this.to() && { to: this.to() + 'T23:59:59' })
    };
    return query;
  }

  // ========================
  // SELECTION & EXPORT
  // ========================

  toggleSelect(id: string) {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      const ids = new Set(this.transfers().map(t => t.id));
      const next = new Set([...this.selectedIds()].filter(id => !ids.has(id)));
      this.selectedIds.set(next);
    } else {
      const next = new Set(this.selectedIds());
      this.transfers().forEach(t => next.add(t.id));
      this.selectedIds.set(next);
    }
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  exportSelectedCsv() {
    const rows = this.transfers().filter(t => this.selectedIds().has(t.id));
    if (!rows.length) return;
    const header = ['Reference', 'Date', 'Direction', 'Counterparty', 'Phone', 'Amount (NGN)', 'Status', 'Narration'];
    const lines = rows.map(t => [
      t.reference,
      new Date(t.createdAt).toISOString(),
      t.direction,
      t.counterpartyName,
      t.counterpartyPhone,
      String(t.amount),
      t.status,
      t.narration || ''
    ].map(TransferStore.csvCell).join(','));
    this.downloadText('transfers-selected.csv', [header.map(TransferStore.csvCell).join(','), ...lines].join('\r\n'));
  }

  exportAllCsv(onError?: (msg: string) => void) {
    this._wallet.exportTransfersCsv(this.currentQuery()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transfers-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        if (onError) onError(err.error?.message || 'Export failed');
      }
    });
  }

  private downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static csvCell(value: string): string {
    const v = String(value ?? '');
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  // ========================
  // FORMATTING
  // ========================

  formatAmount(amount: number): string {
    return this._wallet.formatAmount(amount);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const time = d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    if (same(d, today)) return `Today, ${time}`;
    if (same(d, yest)) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + time;
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
      reversed: 'Reversed'
    };
    return map[status] || status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'chip-emerald',
      pending: 'chip-primary',
      failed: 'chip-warn',
      reversed: 'chip-accent'
    };
    return map[status] || 'chip-primary';
  }
}
