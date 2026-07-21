import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WalletService, Bank, SavedBankAccount } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppNavComponent } from '../../../core/components/app-nav/app-nav.component';

@Component({
  selector: 'app-withdraw-desktop',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule, MatSlideToggleModule, AppNavComponent
  ],
  template: `
<app-nav />
<div class="withdraw-page">
  <div class="page-header">
    <button mat-icon-button routerLink="/wallet"><mat-icon>arrow_back</mat-icon></button>
    <h1>Withdraw Funds</h1>
  </div>

  <div class="page-body">
    <div class="main-panel">
      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="withdrawForm" class="withdraw-form">
            @if (savedAccounts().length) {
              <div class="saved-accounts-section">
                <div class="sa-header">Saved Accounts</div>
                <div class="sa-list">
                  @for (acct of savedAccounts(); track acct._id) {
                    <button type="button" class="sa-card"
                      [class.active]="selectedSavedId() === acct._id"
                      (click)="selectSavedAccount(acct)">
                      <div class="sa-badge" [class.default]="acct.isDefault">
                        {{ acct.bankName.charAt(0) }}
                      </div>
                      <div class="sa-details">
                        <span class="sa-bank">{{ acct.bankName }}</span>
                        <span class="sa-number">{{ acct.accountNumber.slice(0,3) }}****{{ acct.accountNumber.slice(-3) }}</span>
                      </div>
                      @if (acct.isDefault) {
                        <span class="sa-default-tag">Default</span>
                      }
                      <button type="button" class="sa-del" (click)="$event.stopPropagation(); removeSaved(acct._id)" matTooltip="Remove">
                        <mat-icon>close</mat-icon>
                      </button>
                    </button>
                  }
                </div>
              </div>
            }

            <div class="balance-banner">
              <span class="bb-label">Available Balance</span>
              <span class="bb-value">{{ _wallet.formatAmount(walletBalance().available) }}</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Amount (NGN)</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="Enter amount" min="500" step="100" inputmode="numeric">
              @if (withdrawForm.get('amount')?.hasError('required')) {
                <mat-error>Amount is required</mat-error>
              }
              @if (withdrawForm.get('amount')?.hasError('min')) {
                <mat-error>Minimum withdrawal is ₦500</mat-error>
              }
              @if (withdrawForm.get('amount')?.errors?.['insufficient']) {
                <mat-error>Insufficient balance</mat-error>
              }
            </mat-form-field>

            <div class="quick-amounts">
              @for (amt of quickAmounts; track amt) {
                <button type="button" class="quick-chip" [class.active]="withdrawForm.get('amount')?.value === amt" (click)="setAmount(amt)">₦{{ amt.toLocaleString() }}</button>
              }
            </div>

            <mat-form-field appearance="outline" class="full-width bank-search-field">
              <mat-label>Search Bank</mat-label>
              <input matInput [matAutocomplete]="bankAuto" [formControl]="bankSearchCtrl" placeholder="Type to search banks...">
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete #bankAuto="matAutocomplete" [displayWith]="displayBankName" (optionSelected)="onBankSelected($event.option.value)">
                @if (filteredBanks().length) {
                  @for (bank of filteredBanks(); track bank.code) {
                    <mat-option [value]="bank">
                      <span class="bank-option-text">{{ bank.name }}</span>
                    </mat-option>
                  }
                } @else {
                  <mat-option disabled>
                    <span class="no-results">No banks match "{{ bankSearchCtrl.value }}"</span>
                  </mat-option>
                }
              </mat-autocomplete>
              @if (withdrawForm.get('bankCode')?.hasError('required') && withdrawForm.get('bankCode')?.touched) {
                <mat-error>Select a bank</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Account Number</mat-label>
              <input matInput formControlName="accountNumber" placeholder="Enter 10-digit account number" maxlength="10" inputmode="numeric" (input)="onAccountInput()">
              @if (withdrawForm.get('accountNumber')?.hasError('required')) {
                <mat-error>Account number is required</mat-error>
              }
              @if (withdrawForm.get('accountNumber')?.hasError('pattern')) {
                <mat-error>Enter a valid 10-digit account number</mat-error>
              }
              @if (withdrawForm.get('accountNumber')?.value?.length === 10 && !resolvedAccountName() && !resolvingAccount()) {
                <mat-hint class="hint-auto">Enter a valid 10-digit account number</mat-hint>
              }
            </mat-form-field>

            @if (resolvingAccount()) {
              <div class="account-status resolving"><mat-spinner diameter="16"></mat-spinner><span>Verifying account...</span></div>
            }
            @if (resolvedAccountName()) {
              <div class="account-status verified">
                <mat-icon>check_circle</mat-icon>
                <div class="acct-info">
                  <span class="acct-name">{{ resolvedAccountName() }}</span>
                  <span class="acct-num">{{ withdrawForm.get('accountNumber')?.value }}</span>
                </div>
                <mat-slide-toggle class="save-toggle" [(ngModel)]="saveAccountToggle" [ngModelOptions]="{standalone: true}" color="primary" matTooltip="Save for future withdrawals">
                  <span class="toggle-label">Save</span>
                </mat-slide-toggle>
              </div>
            }
            @if (accountError()) {
              <div class="account-status error">
                <mat-icon>error</mat-icon><span>{{ accountError() }}</span>
              </div>
            }

            @if (!resolvedAccountName() && !resolvingAccount()) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Account Name (manual)</mat-label>
                <input matInput formControlName="accountName" placeholder="Enter account holder name">
                @if (withdrawForm.get('accountName')?.hasError('required')) {
                  <mat-error>Account name required</mat-error>
                }
              </mat-form-field>
            }

            <div class="fee-summary" *ngIf="withdrawForm.get('amount')?.valid">
              <div class="fee-row"><span>Amount</span><span>{{ _wallet.formatAmount(calculatedAmount()) }}</span></div>
              <div class="fee-row total"><span>You receive</span><span>{{ _wallet.formatAmount(calculatedAmount()) }}</span></div>
            </div>

            <div class="pin-section" *ngIf="formReady">
              <div class="pin-label">Enter your 4-digit PIN to confirm</div>
              <div class="pin-input-row">
                <input
                  *ngFor="let _ of [].constructor(4); let i = index"
                  class="pin-digit"
                  type="password"
                  maxlength="1"
                  inputmode="numeric"
                  [value]="pinDigits()[i] || ''"
                  (input)="onPinInput($event, i)"
                  (keydown)="onPinKeydown($event, i)"
                  [id]="'pin-' + i"
                  [disabled]="submitting()"
                >
              </div>
              @if (pinError()) {
                <div class="pin-error"><mat-icon>error</mat-icon>{{ pinError() }}</div>
              }
            </div>

            <button mat-raised-button class="btn-submit" [disabled]="!canSubmit || submitting()" (click)="submitWithdrawal()">
              @if (submitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <ng-container><mat-icon>send</mat-icon> Withdraw {{ _wallet.formatAmount(calculatedAmount()) }}</ng-container>
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="sidebar">
      <mat-card class="info-card">
        <mat-card-content>
          <h3>Withdrawal Limits</h3>
          <div class="info-row"><span class="info-label">Per Transaction</span><span class="info-value">₦500 - ₦5,000,000</span></div>
          <div class="info-row"><span class="info-label">Daily Limit</span><span class="info-value">₦10,000,000</span></div>
          <div class="info-row"><span class="info-label">Fee</span><span class="info-value">No fees</span></div>
          <div class="info-row"><span class="info-label">Processing</span><span class="info-value">Instant - 24hrs</span></div>
        </mat-card-content>
      </mat-card>

      <mat-card class="info-card security-card">
        <mat-card-content>
          <h3><mat-icon>security</mat-icon> Secure Withdrawal</h3>
          <p>Funds are transferred securely via Paystack. Your PIN is required to authorize each withdrawal.</p>
        </mat-card-content>
      </mat-card>
    </div>
  </div>
</div>
  `,
  styles: [`
    .withdraw-page { padding: 60px 0 0; max-width: 1080px; margin: 0 auto; background: #0A1428; min-height: 100vh; color: #FFFFFF; }
    .page-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .page-header button { color: rgba(255,255,255,0.7); }
    .page-body { display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding: 0 24px 40px; align-items: start; }
    .main-panel { min-width: 0; }
    .form-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; }
    .withdraw-form { display: flex; flex-direction: column; gap: 20px; }
    .balance-banner { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: linear-gradient(135deg, rgba(0,230,118,0.1), rgba(0,200,83,0.05)); border: 1px solid rgba(0,230,118,0.2); border-radius: 12px; }
    .bb-label { font-size: 14px; color: rgba(255,255,255,0.6); }
    .bb-value { font-size: 22px; font-weight: 700; color: #00E676; }

    .saved-accounts-section { margin-bottom: 4px; }
    .sa-header { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .sa-list { display: flex; flex-direction: column; gap: 6px; }
    .sa-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #162245; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left; color: #fff; font-family: inherit; font-size: inherit; }
    .sa-card:hover { background: #1a2a4a; border-color: rgba(0,230,118,0.2); }
    .sa-card.active { border-color: #00E676; background: rgba(0,230,118,0.06); }
    .sa-badge { width: 36px; height: 36px; border-radius: 8px; background: #0D1A30; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: #E8B923; flex-shrink: 0; }
    .sa-badge.default { background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; }
    .sa-details { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
    .sa-bank { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sa-number { font-size: 11px; color: rgba(255,255,255,0.35); }
    .sa-default-tag { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #00E676; background: rgba(0,230,118,0.1); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px; flex-shrink: 0; }
    .sa-del { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; padding: 2px; display: flex; align-items: center; transition: color 0.2s; flex-shrink: 0; }
    .sa-del:hover { color: #f44336; }
    .sa-del mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .save-toggle { margin-left: auto; }
    .toggle-label { font-size: 11px; color: rgba(255,255,255,0.5); }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch__track { border-radius: 12px !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch__icon { width: 14px !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch { width: 36px !important; height: 20px !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch__track { width: 36px !important; height: 20px !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch__thumb { width: 16px !important; height: 16px !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch--selected .mdc-switch__thumb { background-color: #00E676 !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch--selected .mdc-switch__track { background-color: rgba(0,230,118,0.3) !important; }
    .account-status.verified .save-toggle { margin-right: -4px; }
    .full-width { width: 100%; }
    ::ng-deep .mat-mdc-form-field-outline { background: #162245 !important; border-radius: 8px; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: #162245 !important; border-radius: 8px !important; height: 52px !important; }
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.1) !important; }
    ::ng-deep .mat-mdc-input-element { color: #FFFFFF !important; caret-color: #00E676; font-size: 16px !important; }
    ::ng-deep .mat-mdc-select-value-text { color: #FFFFFF !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-form-field-hint { color: rgba(255,255,255,0.4) !important; font-size: 12px; }
    .quick-amounts { display: flex; flex-wrap: wrap; gap: 8px; }
    .quick-chip { padding: 8px 18px; background: #162245; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .quick-chip:hover { background: #1e2d50; color: #FFFFFF; }
    .quick-chip.active { background: rgba(0,230,118,0.15); border-color: rgba(0,230,118,0.3); color: #00E676; }
    .account-status { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
    .account-status.resolving { background: rgba(232,185,35,0.1); border: 1px solid rgba(232,185,35,0.2); color: #E8B923; gap: 12px; }
    .account-status.verified { display: flex; align-items: center; gap: 10px; background: rgba(0,230,118,0.1); border: 1px solid rgba(0,230,118,0.25); color: #00E676; }
    .account-status.verified mat-icon { flex-shrink: 0; }
    .account-status.verified .acct-info { flex: 1; }
    .acct-info { display: flex; flex-direction: column; }
    .acct-name { font-weight: 600; }
    .acct-num { font-size: 12px; opacity: 0.7; }
    .account-status.error { background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.25); color: #f44336; }
    .fee-summary { background: #162245; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
    .fee-row { display: flex; justify-content: space-between; font-size: 14px; color: rgba(255,255,255,0.6); }
    .fee-row.total { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; font-weight: 700; color: #FFFFFF; font-size: 16px; }
    .pin-section { text-align: center; padding: 12px 0 4px; }
    .pin-label { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
    .pin-input-row { display: flex; justify-content: center; gap: 12px; }
    .pin-digit { width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: 700; background: #162245; border: 2px solid rgba(255,255,255,0.12); border-radius: 10px; color: #FFFFFF; outline: none; transition: border-color 0.2s; }
    .pin-digit:focus { border-color: #00E676; }
    .pin-digit:disabled { opacity: 0.5; }
    .pin-error { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px; color: #f44336; font-size: 13px; }
    .btn-submit { height: 52px; font-size: 16px; font-weight: 600; border-radius: 12px; background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-submit mat-spinner { width: 20px !important; height: 20px !important; }
    .sidebar { display: flex; flex-direction: column; gap: 16px; }
    .info-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; color: #FFFFFF; }
    .info-card h3 { margin: 0 0 12px; font-size: 15px; font-weight: 600; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .info-label { color: rgba(255,255,255,0.5); }
    .info-value { font-weight: 500; color: #FFFFFF; }
    .bank-search-field .mat-mdc-form-field-icon-suffix { color: rgba(255,255,255,0.4); }
    .bank-option-text { font-size: 14px; }
    .no-results { font-size: 13px; color: rgba(255,255,255,0.4); padding: 8px 0; display: block; }
    ::ng-deep .mat-mdc-autocomplete-panel { background: #0D1A30 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
    ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option { color: rgba(255,255,255,0.85) !important; font-size: 14px !important; min-height: 44px !important; }
    ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) { background: rgba(0,230,118,0.08) !important; }
    ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option.mat-mdc-option-active { background: rgba(0,230,118,0.12) !important; }
    ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option .mdc-list-item__primary-text { color: inherit !important; }
    ::ng-deep .cdk-overlay-pane:has(.mat-mdc-autocomplete-panel) { margin-top: 4px; }
    .security-card h3 { display: flex; align-items: center; gap: 8px; }
    .security-card h3 mat-icon { font-size: 20px; color: #00E676; }
    .security-card p { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.5; margin: 0; }
  `]
})
export class WithdrawDesktopComponent implements OnInit {
  _wallet = inject(WalletService);
  _auth = inject(AuthService);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);
  private _fb = inject(FormBuilder);

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

  walletBalance = this._wallet.balance;

  calculatedAmount = signal(0);

  withdrawForm: FormGroup;

  private getBankName(code: string): string {
    const bank = this.banks().find(b => b.code === code);
    return bank?.name || '';
  }

  get formReady(): boolean {
    const accountNameValid = !!this.resolvedAccountName() || (this.withdrawForm.get('accountName')?.value?.trim()?.length >= 2);
    return !!(this.withdrawForm.get('amount')?.valid && this.withdrawForm.get('bankCode')?.valid
      && this.withdrawForm.get('accountNumber')?.valid && accountNameValid);
  }

  get canSubmit(): boolean {
    return this.formReady && this.pinDigits().every(d => d !== '') && !this.submitting();
  }

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

  ngOnInit() {
    this._wallet.fetchBalance();
    this._wallet.fetchBanks();
    this.banks = this._wallet.banks;
    this.loadSavedAccounts();
  }

  private loadSavedAccounts() {
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
        if (this.selectedSavedId() === id) {
          this.selectedSavedId.set(null);
        }
        this._snackBar.open('Account removed', '', { duration: 2000 });
      }
    });
  }

  private saveCurrentAccount() {
    const formVal = this.withdrawForm.value;
    if (!formVal.bankCode || !formVal.accountNumber) return;
    const name = this.resolvedAccountName() || formVal.accountName?.trim();
    if (!name) return;
    this._wallet.saveAccount({
      bankCode: formVal.bankCode,
      accountNumber: formVal.accountNumber,
      accountName: name,
      bankName: this.getBankName(formVal.bankCode)
    }).subscribe({
      next: () => this.loadSavedAccounts()
    });
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
      document.getElementById('pin-' + (index + 1))?.focus();
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
        document.getElementById('pin-' + (index - 1))?.focus();
      }
      this.pinError.set(null);
      event.preventDefault();
    }
  }

  submitWithdrawal() {
    if (!this.canSubmit) return;
    this.pinError.set(null);
    this.submitting.set(true);
    const pin = this.pinDigits().join('');
    const formVal = this.withdrawForm.value;
    const accountName = this.resolvedAccountName() || formVal.accountName?.trim() || '';
    if (!accountName) { this.pinError.set('Account name is required'); this.submitting.set(false); return; }
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
          this._snackBar.open('Withdrawal of ' + this._wallet.formatAmount(Number(formVal.amount)) + ' processed successfully!', 'OK', { duration: 5000, panelClass: 'snack-success' });
          this._wallet.fetchBalance();
          setTimeout(() => this._router.navigate(['/wallet']), 2000);
        } else {
          this.pinError.set(res.message || 'Withdrawal failed');
          this.pinDigits.set(['', '', '', '']);
          document.getElementById('pin-0')?.focus();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || 'Withdrawal failed. Try again.';
        this.pinError.set(msg);
        this.pinDigits.set(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    });
  }
}
