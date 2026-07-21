import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService, User } from '../../core/services/auth.service';
import { AppNavComponent } from '../../core/components/app-nav/app-nav.component';
import { WalletService } from '../../core/services/wallet.service';
import { StakeService } from '../../core/services/stake.service';
import { OraChatComponent } from '../../core/components/ora-chat/ora-chat.component';
import { FaqSectionComponent } from '../../core/components/faq-section/faq-section.component';

@Component({
  selector: 'app-profile-desktop',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, MatTooltipModule, MatDividerModule, MatTabsModule, MatBadgeModule, AppNavComponent, OraChatComponent, FaqSectionComponent
  ],
    template: `
    <app-nav />
    <div class="profile-container">
      <div class="profile-body">
      <div class="page-header"><h1>Profile</h1></div>

      <mat-card class="profile-header-card">
        <mat-card-content>
          <div class="profile-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <div class="profile-info">
            <h2>{{ user()?.fullName || 'User' }}</h2>
            <p class="profile-phone">{{ formatPhone(user()?.phone) }}</p>
            <div class="verification-badges">
              <mat-chip class="chip-phone-v" selected>
                <mat-icon matChipAvatar>{{ user()?.phoneVerified ? 'verified' : 'phone_android' }}</mat-icon>
                Phone {{ user()?.phoneVerified ? 'Verified' : 'Not Verified' }}
              </mat-chip>
              <mat-chip class="chip-kyc-v" selected>
                <mat-icon matChipAvatar>{{ user()?.kycVerified ? 'verified_user' : 'badge' }}</mat-icon>
                KYC {{ user()?.kycVerified ? 'Verified' : 'Pending' }}
              </mat-chip>
            </div>
          </div>
          <button mat-icon-button routerLink="/wallet" matTooltip="Go to Wallet">
            <mat-icon>account_balance_wallet</mat-icon>
          </button>
        </mat-card-content>
      </mat-card>

      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon referral"><mat-icon>share</mat-icon></div>
            <div class="stat-value">{{ user()?.referralCode || 'N/A' }}</div>
            <div class="stat-label">Referral Code</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon member"><mat-icon>calendar_today</mat-icon></div>
            <div class="stat-value">{{ formatJoinDate(user()?.createdAt) }}</div>
            <div class="stat-label">Member Since</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon email"><mat-icon>email</mat-icon></div>
            <div class="stat-value">{{ user()?.email || 'Not set' }}</div>
            <div class="stat-label">Email</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group class="settings-tabs">
        <mat-tab label="Personal Info">
          <div class="tab-content">
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="settings-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName" autocomplete="name">
                <mat-icon matPrefix>person</mat-icon>
                @if (profileForm.get('fullName')?.hasError('required')) {
                  <mat-error>Full name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
                <mat-icon matPrefix>email</mat-icon>
                @if (profileForm.get('email')?.hasError('email')) {
                  <mat-error>Enter a valid email</mat-error>
                }
              </mat-form-field>

              <div class="readonly-field">
                <label>Phone Number</label>
                <div class="readonly-value">{{ formatPhone(user()?.phone) }}</div>
                <mat-hint>Contact support to change phone number</mat-hint>
              </div>

              <button mat-raised-button 
                class="btn-emerald" 
                type="submit" 
                [disabled]="profileForm.invalid || profileForm.pristine || savingProfile()">
                
                @if (savingProfile()) { 
                  <mat-spinner diameter="20"></mat-spinner> 
                } @else { 
                  <ng-container>
                    <mat-icon>save</mat-icon> 
                    Save Changes
                  </ng-container>
                } 
              </button>
              
            </form>
          </div>
        </mat-tab>

        <mat-tab label="Security">
          <div class="tab-content">
            <div class="security-section">
              <h3>PIN Management</h3>
              <p class="section-desc">Your 6-digit PIN secures your account and authorizes transactions</p>
              <div class="security-actions">
                <button mat-stroked-button class="btn-gold" (click)="showPinChange.set(true)">
                  <mat-icon>lock</mat-icon> Change PIN
                </button>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="security-section">
              <h3>Phone Verification</h3>
              <p class="section-desc">Verified phone numbers receive OTP for login and sensitive actions</p>
              @if (!user()?.phoneVerified) {
                @if (!showPhoneOtp()) {
                  <button mat-raised-button class="btn-emerald" (click)="requestPhoneVerification()">
                    <mat-icon>phone</mat-icon> Verify Phone Number
                  </button>
                } @else {
                  <div class="phone-otp-row">
                    <mat-form-field appearance="outline" class="otp-field">
                      <mat-label>Enter 6-digit code</mat-label>
                      <input matInput [formControl]="phoneOtpCode" placeholder="000000" maxlength="6" inputmode="numeric">
                    </mat-form-field>
                    <button mat-raised-button class="btn-emerald" (click)="confirmPhoneVerification()" [disabled]="phoneOtpCode.invalid || verifyingPhone()">
                      @if (verifyingPhone()) {
                        <mat-spinner diameter="18"></mat-spinner>
                      } @else {
                        <ng-container><mat-icon>check</mat-icon> Confirm</ng-container>
                      }
                    </button>
                    <button mat-button class="btn-cancel-otp" (click)="showPhoneOtp.set(false); phoneOtpCode.reset()">Cancel</button>
                  </div>
                }
              } @else {
                <mat-chip class="chip-phone-v" selected>
                  <mat-icon matChipAvatar>verified</mat-icon> Phone Verified
                </mat-chip>
              }
            </div>

            <mat-divider></mat-divider>

            <div class="security-section">
              <h3>KYC Verification</h3>
              <p class="section-desc">Complete KYC to unlock higher limits and faster withdrawals</p>
              <div class="kyc-steps">
                <div class="kyc-step" [class.completed]="user()?.kycVerified">
                  <div class="step-icon" [class.done]="user()?.kycVerified">
                    <mat-icon>{{ user()?.kycVerified ? 'check' : '1' }}</mat-icon>
                  </div>
                  <div class="step-info">
                    <span class="step-title">Basic Verification</span>
                    <span class="step-desc">Phone number verification</span>
                  </div>
                  <mat-chip class="chip-phone-v" selected>{{ user()?.phoneVerified ? 'Complete' : 'Pending' }}</mat-chip>
                </div>

                <div class="kyc-step" [class.completed]="user()?.kycVerified">
                  <div class="step-icon" [class.done]="user()?.kycVerified">
                    <mat-icon>{{ user()?.kycVerified ? 'check' : '2' }}</mat-icon>
                  </div>
                  <div class="step-info">
                    <span class="step-title">Identity Verification</span>
                    <span class="step-desc">Verify your identity with BVN or NIN</span>
                  </div>
                  @if (user()?.kycVerified) {
                    <mat-chip class="chip-phone-v" selected>Complete</mat-chip>
                  } @else {
                    <div class="kyc-form-inline">
                      <div class="kyc-type-toggle">
                        <button class="type-btn-sm" [class.active]="kycType() === 'bvn'" (click)="kycType.set('bvn')">BVN</button>
                        <button class="type-btn-sm" [class.active]="kycType() === 'nin'" (click)="kycType.set('nin')">NIN</button>
                      </div>
                      <div class="kyc-input-row">
                        <mat-form-field appearance="outline" class="kyc-field">
                          <mat-label>{{ kycType() === 'bvn' ? 'BVN Number' : 'NIN Number' }}</mat-label>
                          <input matInput [formControl]="kycNumberCtrl" placeholder="11-digit number" maxlength="11" inputmode="numeric">
                        </mat-form-field>
                        <button mat-stroked-button class="btn-kyc-submit" (click)="submitKyc()" [disabled]="kycNumberCtrl.invalid || submittingKyc()">
                          @if (submittingKyc()) {
                            <mat-spinner diameter="18"></mat-spinner>
                          } @else {
                            <ng-container><mat-icon>verified_user</mat-icon> Submit</ng-container>
                          }
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <div class="kyc-step" [class.completed]="user()?.kycVerified">
                  <div class="step-icon" [class.done]="user()?.kycVerified">
                    <mat-icon>{{ user()?.kycVerified ? 'check' : '3' }}</mat-icon>
                  </div>
                  <div class="step-info">
                    <span class="step-title">Address Verification</span>
                    <span class="step-desc">Utility bill/bank statement (coming soon)</span>
                  </div>
                  <mat-chip class="chip-gray" selected>Locked</mat-chip>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Referral">
          <div class="tab-content">
            <mat-card class="referral-card">
              <mat-card-content>
                <div class="referral-header">
                  <mat-icon>card_giftcard</mat-icon>
                  <div>
                    <h3>Refer & Earn</h3>
                    <p>Share your code, earn bonuses when friends join and bet</p>
                  </div>
                </div>

                <div class="referral-code-display">
                  <span class="code">{{ user()?.referralCode }}</span>
                  <button mat-icon-button (click)="copyReferralCode()" matTooltip="Copy code">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>

                <div class="referral-actions">
                  <button mat-raised-button class="btn-emerald" (click)="shareReferral()">
                    <mat-icon>share</mat-icon> Share Referral
                  </button>
                  <button mat-stroked-button class="btn-gold" (click)="copyReferralCode()">
                    <mat-icon>link</mat-icon> Copy Link
                  </button>
                </div>

                <mat-divider></mat-divider>

                <div class="referral-stats">
                  <div class="stat">
                    <div class="stat-value">{{ referralStats()?.totalReferrals || 0 }}</div>
                    <div class="stat-label">Referrals</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">₦{{ referralStats()?.referralBonus?.toLocaleString() || '0' }}</div>
                    <div class="stat-label">Earned</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="referral-info-card">
              <mat-card-header>
                <mat-card-title>How it works</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <ul class="referral-steps">
                  <li><strong>Share</strong> your referral code with friends</li>
                  <li><strong>They sign up</strong> using your code</li>
                  <li><strong>They bet</strong> and you earn commission</li>
                  <li><strong>Withdraw</strong> earnings to your wallet</li>
                </ul>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Support">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Help & Support</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="support-options">
                  <button mat-stroked-button class="support-option" (click)="openFaq()">
                    <mat-icon>help_outline</mat-icon>
                    <div>
                      <span class="option-title">FAQ</span>
                      <span class="option-desc">Find answers to common questions</span>
                    </div>
                    <mat-icon>chevron_right</mat-icon>
                  </button>

                  <button mat-stroked-button class="support-option" (click)="openOraChat()">
                    <mat-icon>smart_toy</mat-icon>
                    <div>
                      <span class="option-title">Ora AI</span>
                      <span class="option-desc">Ask Ora, your AI assistant</span>
                    </div>
                    <mat-icon>chevron_right</mat-icon>
                  </button>

                  <button mat-stroked-button class="support-option" (click)="sendEmail()">
                    <mat-icon>email</mat-icon>
                    <div>
                      <span class="option-title">Email Support</span>
                      <span class="option-desc">support&#64;betpool.tech</span>
                    </div>
                    <mat-icon>chevron_right</mat-icon>
                  </button>

                  <!-- <button mat-stroked-button class="support-option" (click)="callSupport()">
                    <mat-icon>phone</mat-icon>
                    <div>
                      <span class="option-title">Call Us</span>
                      <span class="option-desc">0800-INVESTBETZ</span>
                    </div>
                    <mat-icon>chevron_right</mat-icon>
                  </button> -->
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="legal-links">
              <mat-card-content>
                <a routerLink="/terms" mat-stroked-button class="legal-link">
                  <mat-icon>description</mat-icon> Terms of Service
                </a>
                <a routerLink="/privacy" mat-stroked-button class="legal-link">
                  <mat-icon>privacy_tip</mat-icon> Privacy Policy
                </a>
                <a routerLink="/cookies" mat-stroked-button class="legal-link">
                  <mat-icon>cookie</mat-icon> Cookie Policy
                </a>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>

      @if (showPinChange()) {
        <div class="modal-overlay" (click)="showPinChange.set(false)">
          <div class="modal-container" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Change PIN</h3>
              <button mat-icon-button (click)="showPinChange.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <form [formGroup]="pinForm" (ngSubmit)="changePin()" class="modal-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current PIN</mat-label>
                <input matInput formControlName="currentPin" type="password" maxlength="6" autocomplete="off">
                <mat-icon matPrefix>lock</mat-icon>
                @if (pinForm.get('currentPin')?.hasError('required')) {
                  <mat-error>Current PIN required</mat-error>
                }
                @if (pinForm.get('currentPin')?.hasError('pattern')) {
                  <mat-error>PIN must be 6 digits</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New PIN</mat-label>
                <input matInput formControlName="newPin" type="password" maxlength="6" autocomplete="new-password">
                <mat-icon matPrefix>lock_outline</mat-icon>
                @if (pinForm.get('newPin')?.hasError('required')) {
                  <mat-error>New PIN required</mat-error>
                }
                @if (pinForm.get('newPin')?.hasError('pattern')) {
                  <mat-error>PIN must be 6 digits</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New PIN</mat-label>
                <input matInput formControlName="confirmPin" type="password" maxlength="6" autocomplete="new-password">
                <mat-icon matPrefix>lock_outline</mat-icon>
                @if (pinForm.hasError('pinMismatch')) {
                  <mat-error>PINs do not match</mat-error>
                }
              </mat-form-field>

              <div class="modal-actions">
                <button mat-button type="button" (click)="showPinChange.set(false)">Cancel</button>
                <button mat-raised-button class="btn-emerald" type="submit" [disabled]="pinForm.invalid || changingPin()">
                  @if (changingPin()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Change PIN
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showOraChat()) {
        <app-ora-chat (close)="showOraChat.set(false)" />
      }

      @if (showFaq()) {
        <div class="faq-overlay">
          <div class="faq-modal">
            <button class="faq-back" (click)="showFaq.set(false)"><mat-icon>arrow_back</mat-icon> Back</button>
            <app-faq-section />
          </div>
        </div>
      }
      </div>
    </div>
  `,
  styles: [`
    .profile-container { padding: 0; max-width: 800px; margin: 0 auto; background: #0A1428; min-height: 100vh; color: #FFFFFF; }

    .profile-body { padding: 0 24px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 16px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; }
    .profile-header-card { margin-bottom: 20px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #FFFFFF; }
    .profile-header-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #00E676, #00C853); display: flex; align-items: center; justify-content: center; color: #0A1428; flex-shrink: 0; }
    .profile-avatar mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .profile-info { flex: 1; }
    .profile-info h2 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #FFFFFF; }
    .profile-phone { margin: 0; color: rgba(255,255,255,0.5); font-size: 14px; }
    .verification-badges { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .verification-badges mat-chip { height: 28px; font-size: 12px; }
    .profile-header-card button:last-child { color: #E8B923; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { text-align: center; padding: 20px 12px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #FFFFFF; }
    .stat-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 20px; }
    .stat-icon.referral { background: rgba(0,230,118,0.15); color: #00E676; }
    .stat-icon.member { background: rgba(232,185,35,0.15); color: #E8B923; }
    .stat-icon.email { background: rgba(0,230,118,0.1); color: #00E676; }
    .stat-value { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: #FFFFFF; word-break: break-all; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
    .settings-tabs { background: #0D1A30; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .settings-tabs .mat-mdc-tab-header { background: #0D1A30; }
    ::ng-deep .settings-tabs .mat-mdc-tab .mdc-tab__text-label { color: #00E676; font-size: 14px; font-weight: 600; }
    ::ng-deep .settings-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color: #00E676; font-weight: 700; }
    ::ng-deep .settings-tabs .mat-mdc-tab-indicator { background: #00E676; height: 3px; }
    ::ng-deep .settings-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content { border-color: #00E676; }
    .tab-content { padding: 20px; color: #FFFFFF; }
    .settings-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .readonly-field { display: flex; flex-direction: column; gap: 4px; }
    .readonly-field label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; }
    .readonly-value { padding: 12px 16px; background: #162245; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 14px; color: #FFFFFF; }
    ::ng-deep .readonly-field .mat-mdc-hint { color: rgba(255,255,255,0.4) !important; }
    .security-section { margin-bottom: 24px; }
    .security-section h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #FFFFFF; }
    .section-desc { margin: 0 0 16px; color: rgba(255,255,255,0.5); font-size: 14px; }
    .security-actions { display: flex; gap: 12px; }
    .kyc-steps { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .kyc-step { display: flex; align-items: center; gap: 16px; padding: 16px; background: #162245; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; }
    .kyc-step.completed { background: rgba(0,230,118,0.05); border-color: rgba(0,230,118,0.2); }
    .step-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); font-weight: 600; flex-shrink: 0; }
    .step-icon.done { background: rgba(0,230,118,0.2); color: #00E676; }
    .step-info { flex: 1; }
    .step-title { display: block; font-weight: 500; color: #FFFFFF; margin-bottom: 2px; }
    .step-desc { font-size: 12px; color: rgba(255,255,255,0.5); }
    .kyc-form-inline { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 420px; }
    .kyc-type-toggle { display: flex; gap: 4px; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 3px; width: fit-content; }
    .type-btn-sm { background: none; border: none; color: rgba(255,255,255,0.5); padding: 4px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .type-btn-sm.active { background: #0A1428; color: #00E676; }
    .kyc-input-row { display: flex; align-items: flex-start; gap: 8px; }
    .kyc-field { flex: 1; }
    ::ng-deep .kyc-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .kyc-field .mat-mdc-text-field-wrapper { background: #0A1428 !important; border-radius: 8px !important; height: 44px; }
    .btn-kyc-submit { color: #00E676 !important; border-color: #00E676 !important; white-space: nowrap; min-width: 100px; height: 44px; }
    .referral-card { margin-bottom: 16px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #FFFFFF; }
    .referral-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .referral-header mat-icon { font-size: 28px; width: 28px; height: 28px; color: #E8B923; margin-top: 4px; }
    .referral-header h3 { margin: 0 0 4px; color: #FFFFFF; font-size: 18px; }
    .referral-header p { margin: 0; color: rgba(255,255,255,0.5); font-size: 14px; }
    .referral-code-display { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 16px; }
    .code { font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #E8B923; }
    .referral-code-display button { color: #E8B923; }
    .referral-actions { display: flex; gap: 12px; margin-bottom: 16px; }
    .referral-stats { display: flex; justify-content: space-around; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .referral-stats .stat { text-align: center; }
    .referral-stats .stat-value { font-size: 24px; font-weight: 700; color: #00E676; }
    .referral-stats .stat-label { font-size: 12px; color: rgba(255,255,255,0.5); }
    .referral-info-card { background: #162245; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #FFFFFF; }
    ::ng-deep .referral-info-card .mat-mdc-card-title { color: #FFFFFF; }
    .referral-steps { margin: 0; padding-left: 20px; line-height: 2.2; }
    .referral-steps li { font-size: 14px; color: rgba(255,255,255,0.8); }
    .support-options { display: flex; flex-direction: column; gap: 12px; }
    .support-option { display: flex !important; align-items: center; gap: 12px; width: 100%; justify-content: space-between; padding: 16px; background: #162245 !important; border: 1px solid rgba(255,255,255,0.06) !important; color: #FFFFFF !important; border-radius: 10px !important; }
    .support-option mat-icon:first-child { font-size: 24px; width: 24px; height: 24px; color: #00E676; margin-right: 12px; }
    .option-title { display: block; font-weight: 500; color: #FFFFFF; margin-bottom: 2px; }
    .option-desc { display: block; font-size: 12px; color: rgba(255,255,255,0.5); }
    .support-option mat-icon:last-child { color: rgba(255,255,255,0.3); }
    .legal-links { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
    .legal-link { width: 100%; justify-content: flex-start; gap: 8px; background: #162245 !important; border: 1px solid rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.7) !important; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-container { width: 100%; max-width: 400px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .modal-header h3 { margin: 0; font-size: 18px; color: #FFFFFF; }
    .modal-header button { color: rgba(255,255,255,0.7); }
    .modal-form { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .modal-actions button:first-child { color: rgba(255,255,255,0.7); }
    .phone-otp-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .otp-field { width: 180px; }
    ::ng-deep .otp-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .otp-field .mat-mdc-text-field-wrapper { background: #0A1428 !important; border-radius: 8px !important; height: 44px; }
    .btn-cancel-otp { color: rgba(255,255,255,0.5) !important; font-size: 13px; }
    ::ng-deep .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853) !important; color: #0A1428 !important; border: none !important; }
    ::ng-deep .btn-gold { background: transparent !important; color: #E8B923 !important; border: 2px solid #E8B923 !important; }
    ::ng-deep .btn-gold:hover { background: rgba(232,185,35,0.1) !important; }
    ::ng-deep .chip-phone-v { background: rgba(0,230,118,0.2) !important; }
    ::ng-deep .chip-phone-v .mdc-chip__text,
    ::ng-deep .chip-phone-v .mat-mdc-chip-action-label { color: #00E676 !important; }
    ::ng-deep .chip-kyc-v:not(.chip-gray) { background: rgba(232,185,35,0.2) !important; }
    ::ng-deep .chip-kyc-v:not(.chip-gray) .mdc-chip__text,
    ::ng-deep .chip-kyc-v:not(.chip-gray) .mat-mdc-chip-action-label { color: #E8B923 !important; }
    ::ng-deep .chip-gray { background: rgba(255,255,255,0.12) !important; }
    ::ng-deep .chip-gray .mdc-chip__text,
    ::ng-deep .chip-gray .mat-mdc-chip-action-label { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .mdc-chip--selected .mdc-chip__cell,
    ::ng-deep .mat-mdc-chip.mat-mdc-standard-chip { background: transparent !important; }
    ::ng-deep .mat-mdc-form-field-outline { background: #162245 !important; border-radius: 8px; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: #162245 !important; border-radius: 8px !important; }
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.1) !important; }
    ::ng-deep .mat-mdc-input-element { color: #FFFFFF !important; caret-color: #00E676; }
    ::ng-deep .mat-mdc-form-field-label { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-form-field-error { color: #f44336 !important; }
    ::ng-deep .mat-divider { border-top-color: rgba(255,255,255,0.06) !important; }
    ::ng-deep .mat-mdc-snack-bar-container { --mdc-snackbar-supporting-text-color: #FFFFFF; --mdc-snackbar-container-color: #0D1A30; }
    .faq-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .faq-modal { width: 100%; max-width: 600px; max-height: 80vh; overflow-y: auto; background: #0A1428; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px 20px; animation: slideUp 0.3s ease; }
    .faq-back { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: rgba(255,255,255,0.4); font-size: 13px; cursor: pointer; padding: 0; font-family: inherit; }
    .faq-back:hover { color: #00E676; }
    .faq-back mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class ProfileDesktopComponent implements OnInit {
  _auth = inject(AuthService);
  private _wallet = inject(WalletService);
  private _stake = inject(StakeService);
  private _fb = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);

  user = computed(() => this._auth.user());
  walletBalance = computed(() => this._wallet.balance().available || 0);
  activeBetsCount = computed(() => this._stake.activeStakes().length);
  savingProfile = signal(false);
  changingPin = signal(false);
  showPinChange = signal(false);
  showOraChat = signal(false);
  showFaq = signal(false);
  kycType = signal<'bvn' | 'nin'>('bvn');
  kycNumberCtrl = new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]);
  submittingKyc = signal(false);
  referralStats = signal<{ totalReferrals: number; referralBonus: number; referrals: Array<{ fullName: string; createdAt: string }> } | null>(null);

  profileForm: FormGroup;
  pinForm: FormGroup;

  constructor() {
    this.profileForm = this._fb.group({
      fullName: [this.user()?.fullName || '', Validators.required],
      email: [this.user()?.email || '', [Validators.email]]
    });

    this.pinForm = this._fb.group({
      currentPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      confirmPin: ['', Validators.required]
    }, { validators: this.pinMatchValidator });
  }

  pinMatchValidator(form: FormGroup) {
    const newPin = form.get('newPin')?.value;
    const confirmPin = form.get('confirmPin')?.value;
    return newPin && confirmPin && newPin !== confirmPin ? { pinMismatch: true } : null;
  }

  ngOnInit() {
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
    this._auth.getReferralStats().subscribe({
      next: (res) => {
        if (res.success) this.referralStats.set(res.data);
      }
    });
  }

  updateProfile() {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    this.savingProfile.set(true);
    this._auth.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.success && res.data) {
          this._auth.user.set(res.data);
          localStorage.setItem('ib_user', JSON.stringify(res.data));
          this._snackBar.open('Profile updated', 'OK', { duration: 2000 });
        } else {
          this._snackBar.open(res.message || 'Failed to update profile', 'OK', { duration: 4000 });
        }
      },
      error: (err) => {
        this.savingProfile.set(false);
        this._snackBar.open(err.error?.message || 'Failed to update profile', 'OK', { duration: 4000 });
      }
    });
  }

  changePin() {
    if (this.pinForm.invalid) return;
    this.changingPin.set(true);
    const { currentPin, newPin } = this.pinForm.value;
    this._auth.changePin(currentPin, newPin).subscribe({
      next: (res) => {
        this.changingPin.set(false);
        if (res.success) {
          this._snackBar.open('PIN changed successfully', 'OK', { duration: 2000 });
          this.showPinChange.set(false);
          this.pinForm.reset();
        } else {
          this._snackBar.open(res.message || 'Failed to change PIN', 'OK', { duration: 3000 });
        }
      },
      error: () => this.changingPin.set(false)
    });
  }

  showPhoneOtp = signal(false);
  phoneOtpCode = new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]);
  verifyingPhone = signal(false);

  requestPhoneVerification() {
    if (!this.user()?.phone) return;
    this._auth.requestPhoneVerification(this.user()!.phone).subscribe({
      next: (res) => {
        if (res.success) {
          this.showPhoneOtp.set(true);
          this._snackBar.open('Verification code sent via SMS', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send code';
        if (msg === 'Phone already verified') {
          const current = this._auth.user();
          if (current) {
            this._auth.user.set({ ...current, phoneVerified: true });
            localStorage.setItem('ib_user', JSON.stringify({ ...current, phoneVerified: true }));
          }
        }
        this._snackBar.open(msg, 'OK', { duration: 4000 });
      }
    });
  }

  confirmPhoneVerification() {
    if (this.phoneOtpCode.invalid || !this.user()?.phone) return;
    this.verifyingPhone.set(true);
    this._auth.confirmPhoneVerification(this.user()!.phone, this.phoneOtpCode.value!).subscribe({
      next: (res) => {
        this.verifyingPhone.set(false);
        if (res.success) {
          this._snackBar.open('Phone verified successfully!', 'OK', { duration: 3000 });
          this.showPhoneOtp.set(false);
          this.phoneOtpCode.reset();
          if (res.data?.user) {
            this._auth.user.set(res.data.user);
            localStorage.setItem('ib_user', JSON.stringify(res.data.user));
          } else {
            const current = this._auth.user();
            if (current) {
              this._auth.user.set({ ...current, phoneVerified: true });
              localStorage.setItem('ib_user', JSON.stringify({ ...current, phoneVerified: true }));
            }
          }
        } else {
          this._snackBar.open(res.message || 'Verification failed', 'OK', { duration: 4000 });
        }
      },
      error: () => {
        this.verifyingPhone.set(false);
        this._snackBar.open('Verification failed', 'OK', { duration: 4000 });
      }
    });
  }

  copyReferralCode() {
    const code = this.user()?.referralCode;
    if (code) {
      navigator.clipboard.writeText(code);
      this._snackBar.open('Referral code copied!', 'OK', { duration: 2000 });
    }
  }

  shareReferral() {
    const code = this.user()?.referralCode;
    const url = `${window.location.origin}/auth/signup?ref=${code}`;
    if (navigator.share) {
      navigator.share({ title: 'Join me on BetPool', text: `Use my referral code ${code}`, url });
    } else {
      navigator.clipboard.writeText(url);
      this._snackBar.open('Referral link copied!', 'OK', { duration: 2000 });
    }
  }

  openFaq() { this.showFaq.set(true); }
  openOraChat() { this.showOraChat.set(true); }
  sendEmail() { window.open('mailto:support@betpool.tech'); }
  callSupport() { window.open('tel:+234800INVESTBETZ'); }

  formatPhone(phone?: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('234')) {
      return '+234 ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6, 9) + ' ' + cleaned.slice(9);
    }
    return phone;
  }

  formatJoinDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  }

  submitKyc() {
    if (this.kycNumberCtrl.invalid) return;
    this.submittingKyc.set(true);
    this._auth.submitKyc({ type: this.kycType(), number: this.kycNumberCtrl.value! }).subscribe({
      next: (res) => {
        this.submittingKyc.set(false);
        if (res.success) {
          this._snackBar.open('KYC submitted successfully!', 'OK', { duration: 3000 });
          this._auth.getProfile();
        } else {
          this._snackBar.open(res.message || 'KYC submission failed', 'OK', { duration: 4000 });
        }
      },
      error: () => {
        this.submittingKyc.set(false);
        this._snackBar.open('Failed to submit KYC', 'OK', { duration: 4000 });
      }
    });
  }
}
