import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { WalletService, Bank, SavedBankAccount } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class WithdrawStore {
  private _wallet = inject(WalletService);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);

  readonly walletService = this._wallet;

  banks = signal<Bank[]>([]);
  filteredBanks = signal<Bank[]>([]);
  bankSearchCtrl = new FormControl('');
  resolvedAccountName = signal<string | null>(null);
  accountError = signal<string | null>(null);
  resolvingAccount = signal(false);
  submitting = signal(false);
  pinDigits = signal<string[]>(['', '', '', '']);
  pinError = signal<string | null>(null);
  savedAccounts = signal<SavedBankAccount[]>([]);
  selectedSavedId = signal<string | null>(null);
  saveAccountToggle = false;

  quickAmounts = [5000, 10000, 20000, 50000, 100000];

  readonly walletBalance = this._wallet.balance;
  readonly calculatedAmount = signal(0);

  readonly withdrawForm: FormGroup;

  readonly formReady = computed(() => {
    const accountNameValid = !!this.resolvedAccountName() || (this.withdrawForm.get('accountName')?.value?.trim()?.length >= 2);
    return !!(this.withdrawForm.get('amount')?.valid && this.withdrawForm.get('bankCode')?.valid
      && this.withdrawForm.get('accountNumber')?.valid && accountNameValid);
  });

  readonly canSubmit = computed(() => {
    return this.formReady() && this.pinDigits().every(d => d !== '') && !this.submitting();
  });

  constructor() {
    this.withdrawForm = this._fb.group({
      amount: [null, [Validators.required, Validators.min(500)]],
      bankCode: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      accountName: ['']
    });

    effect(() => {
      const all = this._wallet.banks();
      const val = this.bankSearchCtrl.value;
      const term = (typeof val === 'string' ? val : '').toLowerCase();
      this.filteredBanks.set(term ? all.filter(b => b.name.toLowerCase().includes(term)) : all);
    });

    this.bankSearchCtrl.valueChanges.subscribe(val => {
      const search = (typeof val === 'string' ? val : '').toLowerCase();
      const all = this.banks();
      this.filteredBanks.set(search ? all.filter(b => b.name.toLowerCase().includes(search)) : all);
      if (!search && this.withdrawForm.get('bankCode')?.value) {
        this.withdrawForm.patchValue({ bankCode: '' });
      }
    });

    this.withdrawForm.get('amount')?.valueChanges.subscribe(v => {
      const amt = Number(v) || 0;
      this.calculatedAmount.set(amt);
      const balance = this.walletBalance().available;
      if (balance > 0 && amt > balance) {
        this.withdrawForm.get('amount')?.setErrors({ insufficient: true });
      } else {
        const errs = { ...this.withdrawForm.get('amount')?.errors };
        delete errs['insufficient'];
        this.withdrawForm.get('amount')?.setErrors(Object.keys(errs).length ? errs : null);
      }
    });
  }

  init() {
    this._wallet.fetchBalance();
    this._wallet.fetchBanks();
    this.banks = this._wallet.banks;
    this.loadSavedAccounts();
  }

  private getBankName(code: string): string {
    const bank = this.banks().find(b => b.code === code);
    return bank?.name || '';
  }

  loadSavedAccounts() {
    this._wallet.getSavedAccounts().subscribe({
      next: (res) => {
        if (res.success) {
          this.savedAccounts.set(res.data);
          const def = res.data.find(a => a.isDefault);
          if (def) this.selectSavedAccount(def);
        }
      }
    });
  }

  selectSavedAccount(acct: SavedBankAccount) {
    this.selectedSavedId.set(acct._id);
    this.withdrawForm.patchValue({
      bankCode: acct.bankCode,
      accountNumber: acct.accountNumber,
      accountName: acct.accountName
    });
    this.bankSearchCtrl.setValue(acct.bankName);
    this.resolvedAccountName.set(acct.accountName);
    this.saveAccountToggle = false;
    this.resolveAccount();
  }

  removeSaved(id: string) {
    this._wallet.deleteSavedAccount(id).subscribe({
      next: () => {
        this.savedAccounts.update(list => list.filter(a => a._id !== id));
        if (this.selectedSavedId() === id) this.selectedSavedId.set(null);
      }
    });
  }

  saveCurrentAccount() {
    const formVal = this.withdrawForm.value;
    if (!formVal.bankCode || !formVal.accountNumber) return;
    const name = this.resolvedAccountName() || formVal.accountName?.trim();
    if (!name) return;
    this._wallet.saveAccount({
      bankCode: formVal.bankCode,
      accountNumber: formVal.accountNumber,
      accountName: name,
      bankName: this.getBankName(formVal.bankCode)
    }).subscribe({ next: () => this.loadSavedAccounts() });
  }

  setAmount(amt: number) {
    this.withdrawForm.patchValue({ amount: amt });
  }

  onBankChange() {
    this.resolvedAccountName.set(null);
    this.accountError.set(null);
  }

  onBankSelected(bank: Bank) {
    this.withdrawForm.patchValue({ bankCode: bank.code });
    this.onBankChange();
  }

  displayBankName(bank: Bank | string): string {
    if (typeof bank === 'object' && bank) return bank.name;
    return String(bank || '');
  }

  onAccountInput() {
    const acct = this.withdrawForm.get('accountNumber')?.value || '';
    if (acct.length === 10 && this.withdrawForm.get('bankCode')?.value) {
      this.resolveAccount();
    } else {
      this.resolvedAccountName.set(null);
      this.accountError.set(null);
    }
  }

  resolveAccount() {
    const accountNumber = this.withdrawForm.get('accountNumber')?.value;
    const bankCode = this.withdrawForm.get('bankCode')?.value;
    if (!accountNumber || !bankCode) return;
    this.resolvingAccount.set(true);
    this.accountError.set(null);
    this.resolvedAccountName.set(null);
    this._wallet.resolveAccount(accountNumber, bankCode).subscribe({
      next: (res) => {
        this.resolvingAccount.set(false);
        if (res.success && res.data?.accountName) {
          this.resolvedAccountName.set(res.data.accountName);
        } else {
          this.accountError.set('Could not verify account. Check the account number.');
        }
      },
      error: () => {
        this.resolvingAccount.set(false);
        this.accountError.set('Verification failed. Try again.');
      }
    });
  }

  onPinInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    if (!val) return;
    const newPins = [...this.pinDigits()];
    newPins[index] = val;
    this.pinDigits.set(newPins);
    this.pinError.set(null);
    if (index < 3 && val) {
      const next = document.getElementById('wpin-' + (index + 1));
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
        const prev = document.getElementById('wpin-' + (index - 1));
        prev?.focus();
      }
      this.pinError.set(null);
      event.preventDefault();
    }
  }

  submitWithdrawal(onSuccessMessage?: (msg: string) => void) {
    if (!this.canSubmit()) return;
    this.pinError.set(null);
    this.submitting.set(true);
    const pin = this.pinDigits().join('');
    const formVal = this.withdrawForm.value;
    const accountName = this.resolvedAccountName() || formVal.accountName?.trim() || '';
    if (!accountName) {
      this.pinError.set('Account name is required');
      this.submitting.set(false);
      return;
    }
    this._wallet.initiateWithdrawal({
      amount: Number(formVal.amount),
      bankCode: formVal.bankCode,
      accountNumber: formVal.accountNumber,
      accountName,
      pin
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          if (this.saveAccountToggle) this.saveCurrentAccount();
          if (onSuccessMessage) {
            onSuccessMessage('Withdrawal of ' + this._wallet.formatAmount(Number(formVal.amount)) + ' processed successfully!');
          }
          this._wallet.fetchBalance();
          setTimeout(() => this._router.navigate(['/wallet']), 2000);
        } else {
          this.pinError.set(res.message || 'Withdrawal failed');
          this.resetPin();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.pinError.set(err.error?.message || 'Withdrawal failed. Try again.');
        this.resetPin();
      }
    });
  }

  private resetPin() {
    this.pinDigits.set(['', '', '', '']);
    const first = document.getElementById('wpin-0');
    first?.focus();
  }
}
