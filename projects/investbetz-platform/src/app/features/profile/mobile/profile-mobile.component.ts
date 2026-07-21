import { Component, OnInit, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavComponent } from '../../../core/components/mobile-nav/mobile-nav.component';
import { OraChatComponent } from '../../../core/components/ora-chat/ora-chat.component';
import { FaqSectionComponent } from '../../../core/components/faq-section/faq-section.component';

@Component({
  selector: 'app-profile-mobile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, MobileNavComponent, OraChatComponent, FaqSectionComponent
  ],
  template: `
    <div class="mobile-profile">
      <header class="mobile-header">
        <button mat-icon-button routerLink="/home"><mat-icon>arrow_back</mat-icon></button>
        <h1>Profile</h1>
        <button mat-icon-button (click)="_auth.logout()"><mat-icon>logout</mat-icon></button>
      </header>

      <div class="profile-card">
        <div class="avatar">
          <mat-icon>person</mat-icon>
        </div>
        <div class="info">
          <h2>{{ user()?.fullName || 'User' }}</h2>
          <span class="phone">{{ formatPhone(user()?.phone) }}</span>
        </div>
        <div class="badges">
          <span class="badge" [class.verified]="user()?.phoneVerified">
            <mat-icon>{{ user()?.phoneVerified ? 'verified' : 'phone_android' }}</mat-icon>
            {{ user()?.phoneVerified ? 'Verified' : 'Verify Phone' }}
          </span>
          <span class="badge" [class.verified]="user()?.kycVerified">
            <mat-icon>{{ user()?.kycVerified ? 'verified_user' : 'badge' }}</mat-icon>
            KYC {{ user()?.kycVerified ? 'Verified' : 'Pending' }}
          </span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <mat-icon class="box-icon gold">share</mat-icon>
          <span class="box-val">{{ user()?.referralCode || 'N/A' }}</span>
          <span class="box-lbl">Referral Code</span>
        </div>
        <div class="stat-box">
          <mat-icon class="box-icon emerald">calendar_today</mat-icon>
          <span class="box-val">{{ formatJoinDate(user()?.createdAt) }}</span>
          <span class="box-lbl">Member Since</span>
        </div>
        <div class="stat-box">
          <mat-icon class="box-icon emerald">email</mat-icon>
          <span class="box-val">{{ user()?.email || 'Not set' }}</span>
          <span class="box-lbl">Email</span>
        </div>
      </div>

      <div class="menu-section">
        <button class="menu-item" (click)="activeTab.set('personal')">
          <mat-icon class="menu-icon emerald">person</mat-icon>
          <div class="menu-text">
            <span class="menu-title">Personal Info</span>
            <span class="menu-desc">Name, email, phone</span>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </button>

        <button class="menu-item" (click)="activeTab.set('security')">
          <mat-icon class="menu-icon gold">lock</mat-icon>
          <div class="menu-text">
            <span class="menu-title">Security & PIN</span>
            <span class="menu-desc">PIN, phone verification, KYC</span>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </button>

        <button class="menu-item" (click)="activeTab.set('referral')">
          <mat-icon class="menu-icon gold">card_giftcard</mat-icon>
          <div class="menu-text">
            <span class="menu-title">Referral</span>
            <span class="menu-desc">Share & earn bonuses</span>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </button>

        <button class="menu-item" (click)="activeTab.set('support')">
          <mat-icon class="menu-icon emerald">help_outline</mat-icon>
          <div class="menu-text">
            <span class="menu-title">Support</span>
            <span class="menu-desc">FAQ, live chat, contact</span>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </button>
      </div>

      @if (activeTab() === 'personal') {
        <div class="sheet-overlay" (click)="activeTab.set('')">
          <div class="bottom-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h3>Personal Info</h3>
              <button mat-icon-button (click)="activeTab.set('')"><mat-icon>close</mat-icon></button>
            </div>
            <form [formGroup]="profileForm" class="sheet-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName" autocomplete="name">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
                <mat-icon matPrefix>email</mat-icon>
              </mat-form-field>
              <div class="readonly-phone">
                <label>Phone Number</label>
                <div>{{ formatPhone(user()?.phone) }}</div>
              </div>
              <button class="btn-emerald full-width btn-lg" (click)="updateProfile()" [disabled]="profileForm.invalid || profileForm.pristine || savingProfile()">
                @if (savingProfile()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <mat-icon>save</mat-icon> Save Changes }
              </button>
            </form>
          </div>
        </div>
      }

      @if (activeTab() === 'security') {
        <div class="sheet-overlay" (click)="activeTab.set('')">
          <div class="bottom-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h3>Security & PIN</h3>
              <button mat-icon-button (click)="activeTab.set('')"><mat-icon>close</mat-icon></button>
            </div>
            <div class="sheet-body">
              <div class="sec-section">
                <h4>PIN Management</h4>
                <p>Your 6-digit PIN secures your account</p>
                <button class="btn-gold-outline" (click)="showPinChange.set(true)"><mat-icon>lock</mat-icon> Change PIN</button>
              </div>
              <div class="sec-section">
                <h4>Phone Verification</h4>
                <p>Receive OTP for login and sensitive actions</p>
                @if (!user()?.phoneVerified) {
                  @if (!showPhoneOtp()) {
                    <button class="btn-emerald btn-lg full-width" (click)="requestPhoneVerification()"><mat-icon>phone</mat-icon> Verify Phone</button>
                  } @else {
                    <div class="phone-otp-mobile">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Enter 6-digit code</mat-label>
                        <input matInput [formControl]="phoneOtpCode" placeholder="000000" maxlength="6" inputmode="numeric">
                      </mat-form-field>
                      <button class="btn-emerald btn-lg full-width" (click)="confirmPhoneVerification()" [disabled]="phoneOtpCode.invalid || verifyingPhone()">
                        @if (verifyingPhone()) { <mat-spinner diameter="20"></mat-spinner> }
                        @else { <mat-icon>check</mat-icon> Confirm Code }
                      </button>
                      <button class="btn-cancel-otp-mobile" (click)="showPhoneOtp.set(false); phoneOtpCode.reset()">Cancel</button>
                    </div>
                  }
                } @else {
                  <span class="badge-verified"><mat-icon>verified</mat-icon> Phone Verified</span>
                }
              </div>
              <div class="sec-section">
                <h4>KYC Verification</h4>
                <p>Verify your identity with BVN or NIN</p>
                @if (user()?.kycVerified) {
                  <span class="badge-verified"><mat-icon>verified_user</mat-icon> KYC Verified</span>
                } @else {
                  <div class="kyc-form">
                    <div class="kyc-type-toggle">
                      <button class="type-btn" [class.active]="kycType() === 'bvn'" (click)="kycType.set('bvn')">BVN</button>
                      <button class="type-btn" [class.active]="kycType() === 'nin'" (click)="kycType.set('nin')">NIN</button>
                    </div>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ kycType() === 'bvn' ? 'BVN Number' : 'NIN Number' }}</mat-label>
                      <input matInput [formControl]="kycNumberCtrl" placeholder="11-digit number" maxlength="11" inputmode="numeric">
                    </mat-form-field>
                    <button class="btn-emerald full-width btn-lg" (click)="submitKyc()" [disabled]="kycNumberCtrl.invalid || submittingKyc()">
                      @if (submittingKyc()) { <mat-spinner diameter="20"></mat-spinner> }
                      @else { <mat-icon>verified_user</mat-icon> Submit for Verification }
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (activeTab() === 'referral') {
        <div class="sheet-overlay" (click)="activeTab.set('')">
          <div class="bottom-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h3>Refer & Earn</h3>
              <button mat-icon-button (click)="activeTab.set('')"><mat-icon>close</mat-icon></button>
            </div>
            <div class="sheet-body">
              <div class="ref-code">
                <span class="ref-label">Your Code</span>
                <div class="ref-value">
                  <span>{{ user()?.referralCode }}</span>
                  <button mat-icon-button (click)="copyReferralCode()"><mat-icon>content_copy</mat-icon></button>
                </div>
              </div>
              <div class="ref-actions">
                <button class="btn-emerald btn-lg full-width" (click)="shareReferral()"><mat-icon>share</mat-icon> Share Referral</button>
                <button class="btn-gold-outline btn-lg full-width" (click)="copyReferralCode()"><mat-icon>link</mat-icon> Copy Link</button>
              </div>
              <div class="ref-stats">
                <div class="ref-stat"><strong>{{ referralStats()?.totalReferrals || 0 }}</strong><span>Referrals</span></div>
                <div class="ref-stat"><strong>₦{{ referralStats()?.referralBonus?.toLocaleString() || '0' }}</strong><span>Earned</span></div>
              </div>
              @if ((referralStats()?.referrals?.length || 0) > 0) {
                <div class="ref-list">
                  <div class="ref-list-title">Your Referrals</div>
                  @for (ref of referralStats()?.referrals || []; track ref) {
                    <div class="ref-item">
                      <mat-icon>person</mat-icon>
                      <span>{{ ref.fullName }}</span>
                      <span class="ref-date">{{ formatJoinDate(ref.createdAt) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (activeTab() === 'support') {
        <div class="sheet-overlay" (click)="activeTab.set('')">
          <div class="bottom-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h3>Help & Support</h3>
              <button mat-icon-button (click)="activeTab.set('')"><mat-icon>close</mat-icon></button>
            </div>
            <div class="sheet-body">
              <button class="support-item" (click)="openFaq()">
                <mat-icon>help_outline</mat-icon>
                <div><strong>FAQ</strong><span>Find answers to common questions</span></div>
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button class="support-item" (click)="openOraChat()">
                <mat-icon>auto_awesome</mat-icon>
                <div><strong>Ora AI</strong><span>Ask Ora, your AI assistant</span></div>
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button class="support-item" (click)="sendEmail()">
                <mat-icon>email</mat-icon>
                <div><strong>Email Support</strong><span>support&#64;betpool.tech</span></div>
                <mat-icon>chevron_right</mat-icon>
              </button>
              <!-- <button class="support-item" (click)="callSupport()">
                <mat-icon>phone</mat-icon>
                <div><strong>Call Us</strong><span>0800-INVESTBETZ</span></div>
                <mat-icon>chevron_right</mat-icon>
              </button> -->
            </div>
          </div>
        </div>
      }

      @if (showPinChange()) {
        <div class="sheet-overlay" (click)="showPinChange.set(false)">
          <div class="bottom-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h3>Change PIN</h3>
              <button mat-icon-button (click)="showPinChange.set(false)"><mat-icon>close</mat-icon></button>
            </div>
            <form [formGroup]="pinForm" class="sheet-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current PIN</mat-label>
                <input matInput formControlName="currentPin" type="password" maxlength="6" autocomplete="off">
                <mat-icon matPrefix>lock</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New PIN</mat-label>
                <input matInput formControlName="newPin" type="password" maxlength="6" autocomplete="new-password">
                <mat-icon matPrefix>lock_outline</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New PIN</mat-label>
                <input matInput formControlName="confirmPin" type="password" maxlength="6" autocomplete="new-password">
                <mat-icon matPrefix>lock_outline</mat-icon>
              </mat-form-field>
              <button class="btn-emerald full-width btn-lg" (click)="changePin()" [disabled]="pinForm.invalid || changingPin()">
                @if (changingPin()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <ng-container><mat-icon>lock</mat-icon> Change PIN</ng-container> }
              </button>
            </form>
          </div>
        </div>
      }

      <div class="bottom-spacer"></div>

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

      <app-mobile-nav />
    </div>
  `,
  styles: [`
    .mobile-profile { background: #0A1428; min-height: 100vh; color: #FFFFFF; padding-bottom: 80px; }
    .mobile-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #0D1A30; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 10; }
    .mobile-header h1 { flex: 1; margin: 0; font-size: 20px; font-weight: 700; }
    .mobile-header button { color: rgba(255,255,255,0.7); }
    .profile-card { margin: 12px 16px; padding: 20px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #00E676, #00C853); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .avatar mat-icon { font-size: 36px; width: 36px; height: 36px; color: #0A1428; }
    .info h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .phone { font-size: 14px; color: rgba(255,255,255,0.5); }
    .badges { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; justify-content: center; }
    .badge { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 12px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge.verified { background: rgba(0,230,118,0.15); color: #00E676; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 16px 16px; }
    .stat-box { display: flex; flex-direction: column; align-items: center; padding: 14px 6px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
    .box-icon { font-size: 22px; width: 22px; height: 22px; margin-bottom: 6px; }
    .box-icon.gold { color: #E8B923; }
    .box-icon.emerald { color: #00E676; }
    .box-val { font-size: 13px; font-weight: 600; text-align: center; word-break: break-all; color: #FFFFFF; }
    .box-lbl { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-top: 2px; }
    .menu-section { margin: 0 16px; display: flex; flex-direction: column; gap: 8px; }
    .menu-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; width: 100%; cursor: pointer; color: #FFFFFF; text-align: left; }
    .menu-icon { font-size: 24px; }
    .menu-icon.emerald { color: #00E676; }
    .menu-icon.gold { color: #E8B923; }
    .menu-text { flex: 1; }
    .menu-title { display: block; font-weight: 600; font-size: 15px; }
    .menu-desc { display: block; font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px; }
    .chevron { color: rgba(255,255,255,0.3); }
    .sheet-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: flex-end; z-index: 1000; }
    .bottom-sheet { width: 100%; max-height: 85vh; overflow-y: auto; background: #0D1A30; border-radius: 20px 20px 0 0; padding: 0 0 24px; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 8px auto; }
    .sheet-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px 16px; }
    .sheet-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
    .sheet-header button { color: rgba(255,255,255,0.7); }
    .sheet-form, .sheet-body { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
    .readonly-phone { display: flex; flex-direction: column; gap: 4px; }
    .readonly-phone label { font-size: 12px; color: rgba(255,255,255,0.5); }
    .readonly-phone div { padding: 12px 14px; background: #162245; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 14px; color: rgba(255,255,255,0.6); }
    .sec-section { padding: 12px 0; }
    .sec-section h4 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
    .sec-section p { margin: 0 0 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
    .badge-verified { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(0,230,118,0.15); border-radius: 8px; color: #00E676; font-weight: 500; font-size: 14px; }
    .ref-code { text-align: center; margin-bottom: 12px; }
    .ref-label { font-size: 12px; color: rgba(255,255,255,0.5); display: block; margin-bottom: 4px; }
    .ref-value { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .ref-value span { font-size: 28px; font-weight: 700; letter-spacing: 5px; color: #E8B923; }
    .ref-value button { color: #E8B923; }
    .ref-actions { display: flex; flex-direction: column; gap: 8px; }
    .ref-stats { display: flex; justify-content: space-around; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .ref-stat { display: flex; flex-direction: column; align-items: center; }
    .ref-stat strong { font-size: 22px; color: #00E676; }
    .ref-stat span { font-size: 12px; color: rgba(255,255,255,0.5); }
    .support-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: #162245; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; width: 100%; cursor: pointer; color: #FFFFFF; text-align: left; }
    .support-item mat-icon:first-child { color: #00E676; }
    .support-item div { flex: 1; }
    .support-item strong { display: block; font-size: 14px; }
    .support-item span { display: block; font-size: 11px; color: rgba(255,255,255,0.4); }
    .support-item mat-icon:last-child { color: rgba(255,255,255,0.3); }
    .phone-otp-mobile { display: flex; flex-direction: column; gap: 10px; }
    .btn-cancel-otp-mobile { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; padding: 8px; font-family: inherit; text-align: center; }
    .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-lg { height: 50px; font-size: 16px; padding: 0 24px; }
    .btn-gold-outline { background: transparent; color: #E8B923; border: 2px solid #E8B923; border-radius: 12px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 24px; height: 44px; }
    .full-width { width: 100%; }
    .bottom-spacer { height: 80px; }
    ::ng-deep .mat-mdc-form-field-outline { background: #162245 !important; border-radius: 8px; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: #162245 !important; border-radius: 8px !important; height: 50px !important; }
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.1) !important; }
    ::ng-deep .mat-mdc-input-element { color: #FFFFFF !important; caret-color: #00E676; font-size: 16px !important; }
    ::ng-deep .mat-mdc-select-value-text { color: #FFFFFF !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-snack-bar-container { --mdc-snackbar-supporting-text-color: #FFFFFF; --mdc-snackbar-container-color: #0D1A30; }
    .faq-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .faq-modal { width: 100%; max-width: 600px; max-height: 80vh; overflow-y: auto; background: #0A1428; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px 20px; animation: slideUp 0.3s ease; }
    .faq-back { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: rgba(255,255,255,0.4); font-size: 13px; cursor: pointer; padding: 0; font-family: inherit; }
    .faq-back:hover { color: #00E676; }
    .faq-back mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .kyc-form { display: flex; flex-direction: column; gap: 10px; }
    .kyc-type-toggle { display: flex; gap: 8px; }
    .type-btn { flex: 1; padding: 10px; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 600; cursor: pointer; }
    .type-btn.active { background: rgba(0,230,118,0.15); border-color: #00E676; color: #00E676; }
    .ref-list { margin-top: 12px; }
    .ref-list-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
    .ref-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #162245; border-radius: 8px; margin-bottom: 6px; }
    .ref-item mat-icon { font-size: 18px; color: #00E676; }
    .ref-item span:first-of-type { flex: 1; font-size: 14px; }
    .ref-date { font-size: 11px; color: rgba(255,255,255,0.4); }
  `]
})
export class ProfileMobileComponent implements OnInit, AfterViewInit {
  _auth = inject(AuthService);
  private _fb = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);

  user = computed(() => this._auth.user());
  savingProfile = signal(false);
  changingPin = signal(false);
  showPinChange = signal(false);
  showOraChat = signal(false);
  showFaq = signal(false);
  activeTab = signal<string>('');
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

  ngOnInit() {}

  ngAfterViewInit() {
    this._auth.getReferralStats().subscribe({
      next: (res) => {
        if (res.success) this.referralStats.set(res.data);
      }
    });
  }

  submitKyc() {
    if (this.kycNumberCtrl.invalid) return;
    this.submittingKyc.set(true);
    this._auth.submitKyc({ type: this.kycType(), number: this.kycNumberCtrl.value! }).subscribe({
      next: (res) => {
        this.submittingKyc.set(false);
        if (res.success) {
          this._snackBar.open('KYC submitted successfully!', 'OK', { duration: 2000 });
          this.activeTab.set('');
          this._auth.getProfile();
        } else {
          this._snackBar.open(res.message || 'KYC submission failed', 'OK', { duration: 3000 });
        }
      },
      error: () => this.submittingKyc.set(false)
    });
  }

  openOraChat() {
    this.showOraChat.set(true);
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
          this.activeTab.set('');
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
      navigator.share({ title: 'Join me on InvestBetz', text: `Use my referral code ${code}`, url });
    } else {
      navigator.clipboard.writeText(url);
      this._snackBar.open('Referral link copied!', 'OK', { duration: 2000 });
    }
  }

  openFaq() { this.showFaq.set(true); }
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
}
