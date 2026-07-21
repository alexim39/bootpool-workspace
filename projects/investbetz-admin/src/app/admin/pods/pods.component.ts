import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { AdminService, AdminPod, PaginatedResponse, CurationResponse, CurationFixture, SettlementCheckResult, ReserveConsumption } from '../services/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { PodFormComponent } from './pod-form.component';

@Component({
  selector: 'app-pods',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule, MatCheckboxModule,
    PodFormComponent],
  template: `
    <div class="pods-page">
      <div class="page-header">
        <div class="page-header-left">
          <h1>Pods</h1>
          <div class="stat-group">
            <span class="stat-item draft-dot">Draft {{ draftCount }}</span>
            <span class="stat-item pub-dot">Publish {{ publishedCount }}</span>
            <span class="stat-item act-dot">Live {{ activeCount }}</span>
            <span class="stat-item past-dot">Past {{ settledCount + cancelledCount }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="btn-sync" (click)="syncFromApi()" [disabled]="syncing">
            <mat-icon>sync</mat-icon>
            <span *ngIf="!syncing">Sync</span>
            <span *ngIf="syncing">Syncing...</span>
          </button>
          <button mat-stroked-button class="btn-settle-all" (click)="aiSettleAll()" [disabled]="settlingAll">
            <mat-icon>fact_check</mat-icon>
            <span *ngIf="!settlingAll">Settle All</span>
            <span *ngIf="settlingAll">Settling...</span>
          </button>
          <button mat-raised-button class="btn-create" (click)="showCreateForm = true">
            <mat-icon>add</mat-icon> Create Pod
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="switchTab('active')">
            <mat-icon>rocket_launch</mat-icon> Active

          </button>
          <button class="tab-btn" [class.active]="activeTab === 'past'" (click)="switchTab('past')">
            <mat-icon>history</mat-icon> Past
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'disputed'" (click)="switchTab('disputed')">
            <mat-icon>gavel</mat-icon> Disputed
            <span class="tab-badge warn" *ngIf="disputedCount">{{ disputedCount }}</span>
          </button>
        </div>
        <div class="filter-controls">
          <div class="search-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input class="search-input" [(ngModel)]="searchQuery" (input)="onSearchInput()" placeholder="Search pods..." />
          </div>
          <div class="date-range">
            <input class="date-input" type="date" [(ngModel)]="dateFrom" (change)="onFilterChange()" title="Match date from" />
            <span class="date-sep">–</span>
            <input class="date-input" type="date" [(ngModel)]="dateTo" (change)="onFilterChange()" title="Match date to" />
            <button class="date-clear" *ngIf="dateFrom || dateTo" (click)="dateFrom=''; dateTo=''; onFilterChange()" matTooltip="Clear dates">✕</button>
          </div>
          <div class="sub-filters" *ngIf="activeTab !== 'disputed'">
            <button class="sub-chip" [class.active]="statusFilter === ''" (click)="statusFilter = ''; onFilterChange()">All</button>
            <button class="sub-chip draft" *ngIf="activeTab === 'active'" [class.active]="statusFilter === 'draft'" (click)="statusFilter = 'draft'; onFilterChange()">Draft</button>
            <button class="sub-chip published" *ngIf="activeTab === 'active'" [class.active]="statusFilter === 'published'" (click)="statusFilter = 'published'; onFilterChange()">Published</button>
            <button class="sub-chip active" *ngIf="activeTab === 'active'" [class.active]="statusFilter === 'active'" (click)="statusFilter = 'active'; onFilterChange()">Active</button>
            <button class="sub-chip settled" *ngIf="activeTab === 'past'" [class.active]="statusFilter === 'settled'" (click)="statusFilter = 'settled'; onFilterChange()">Settled</button>
            <button class="sub-chip cancelled" *ngIf="activeTab === 'past'" [class.active]="statusFilter === 'cancelled'" (click)="statusFilter = 'cancelled'; onFilterChange()">Cancelled</button>
          </div>
        </div>
      </div>

      <div class="pod-detail-panel" *ngIf="selectedPod">
        <div class="panel-header">
          <h3>{{ selectedPod.title }}</h3>
          <div class="panel-header-meta">
            <span class="chip" [style.background]="statusColor(selectedPod.status)">{{ selectedPod.status }}</span>
            <span class="chip" style="background:#2196f3" *ngIf="selectedPod.settlementStatus">{{ selectedPod.settlementStatus }}</span>
          </div>
          <button mat-icon-button (click)="selectedPod = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="panel-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Match</span>
              <span class="value">{{ selectedPod.homeTeam }} vs {{ selectedPod.awayTeam }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Match Date</span>
              <span class="value">{{ selectedPod.matchDate | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Sport</span>
              <span class="value">{{ selectedPod.sport }}</span>
            </div>
            <div class="detail-item">
              <span class="label">League</span>
              <span class="value">{{ selectedPod.league || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Market Type</span>
              <span class="value">{{ selectedPod.marketType || '1X2' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Selection / Pick</span>
              <span class="value" style="color:#00E676;font-weight:600">{{ selectedPod.selection }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Adj. Odds</span>
              <span class="value" style="color:#E8B923;font-size:18px;font-weight:700">{{ selectedPod.gainsMultiplier }}x</span>
            </div>
            <div class="detail-item" *ngIf="selectedPod.marketOdds != null">
              <span class="label">Market Odds (Reach Match)</span>
              <span class="value" style="color:rgba(255,255,255,0.6);font-size:16px">{{ selectedPod.marketOdds }}x</span>
            </div>
            <div class="detail-item" *ngIf="selectedPod.refundPercent != null">
              <span class="label">Refund %</span>
              <span class="value" style="color:#E8B923;font-size:16px;font-weight:600">{{ selectedPod.refundPercent }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Stake Range</span>
              <span class="value">\u20A6{{ selectedPod.minStake | number }} – \u20A6{{ selectedPod.maxStake | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Total Staked</span>
              <span class="value">\u20A6{{ selectedPod.currentExposure | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Max Exposure</span>
              <span class="value">\u20A6{{ selectedPod.maxTotalExposure | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Exposure Used</span>
              <span class="value">
                <span class="exposure-pct" [style.color]="getExposurePercent(selectedPod) >= 80 ? '#f44336' : getExposurePercent(selectedPod) >= 50 ? '#E8B923' : '#00E676'">
                  {{ getExposurePercent(selectedPod) }}%
                </span>
                <div class="exposure-bar-bg" style="margin-top:4px"><div class="exposure-bar-fill" [style.width.%]="getExposurePercent(selectedPod)" [style.background]="getExposurePercent(selectedPod) >= 80 ? '#f44336' : getExposurePercent(selectedPod) >= 50 ? '#E8B923' : '#00E676'"></div></div>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Participants</span>
              <span class="value">{{ selectedPod.currentParticipants }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Staking Opens</span>
              <span class="value">{{ selectedPod.opensAt | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Staking Closes</span>
              <span class="value" [style.color]="isStakingClosed(selectedPod) ? '#f44336' : '#00E676'">{{ selectedPod.stakingClosesAt | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Est. Settlement</span>
              <span class="value">{{ selectedPod.settlementEstimateLabel || (selectedPod.settlementEstimateAt | date:'MMM d, y') }}</span>
            </div>
            <div class="detail-item" *ngIf="selectedPod.metadata?.oraCurated">
              <span class="label">Ora Confidence</span>
              <span class="value">
                <span class="confidence-badge" [style.background]="(selectedPod.metadata?.oraConfidence || 0) >= 70 ? 'rgba(0,230,118,0.2)' : (selectedPod.metadata?.oraConfidence || 0) >= 45 ? 'rgba(232,185,35,0.2)' : 'rgba(244,67,54,0.2)'" [style.color]="(selectedPod.metadata?.oraConfidence || 0) >= 70 ? '#00E676' : (selectedPod.metadata?.oraConfidence || 0) >= 45 ? '#E8B923' : '#f44336'">
                  {{ selectedPod.metadata?.oraConfidence }}%
                </span>
              </span>
            </div>
          </div>
          <div class="detail-actions" *ngIf="canManage(selectedPod)">
            <button mat-stroked-button class="action-publish" *ngIf="selectedPod.status === 'draft'" (click)="publishPod(selectedPod.id)">
              <mat-icon>publish</mat-icon> Publish
            </button>
            <button mat-stroked-button class="action-activate" *ngIf="selectedPod.status === 'published'" (click)="activatePod(selectedPod.id)">
              <mat-icon>play_arrow</mat-icon> Activate
            </button>
            <button mat-stroked-button class="action-settle" *ngIf="selectedPod.status === 'active' || selectedPod.status === 'published'" (click)="startSettle()">
              <mat-icon>check_circle</mat-icon> Settle
            </button>
            <button mat-stroked-button class="action-ai-settle" *ngIf="selectedPod.status === 'active' || selectedPod.status === 'published'" (click)="aiCheckSettle()" [disabled]="checkingSettle">
              <mat-icon>auto_awesome</mat-icon>
              {{ checkingSettle ? 'Checking...' : 'AI Settle' }}
            </button>
            <button mat-stroked-button class="action-cancel" *ngIf="['draft','published','active'].includes(selectedPod.status)" (click)="cancelPod(selectedPod.id)">
              <mat-icon>cancel</mat-icon> Cancel
            </button>
          </div>
          <div class="ai-settle-panel" *ngIf="settleCheck">
            <div class="ai-settle-header">
              <mat-icon style="color:#CE93D8">auto_awesome</mat-icon>
              <span>Ora Settlement Check</span>
              <button mat-icon-button (click)="settleCheck = null"><mat-icon>close</mat-icon></button>
            </div>
            <div class="ai-settle-body">
              <div class="ai-settle-result" *ngIf="settleCheck.matchFound">
                <div class="score-row">{{ settleCheck.homeTeam }} <strong>{{ settleCheck.homeScore ?? '?' }}</strong> - <strong>{{ settleCheck.awayScore ?? '?' }}</strong> {{ settleCheck.awayTeam }}</div>
                <div class="status-row">Status: <span class="match-status">{{ settleCheck.matchStatus }}</span></div>
              </div>
              <div class="ai-settle-result" *ngIf="!settleCheck.matchFound">
                <div class="no-data">No match data from sports API</div>
              </div>
              <div class="verdict-row">
                <span class="verdict-label">Ora recommends:</span>
                <span class="verdict-value" [class.win]="settleCheck.recommendedResult === 'win'" [class.loss]="settleCheck.recommendedResult === 'loss'" [class.void]="settleCheck.recommendedResult === 'void'" [class.unknown]="settleCheck.recommendedResult === 'cannot_determine'">
                  {{ settleCheck.recommendedResult === 'cannot_determine' ? 'Cannot determine' : settleCheck.recommendedResult.toUpperCase() }}
                </span>
                <span class="verdict-confidence">({{ settleCheck.confidence }}% confidence)</span>
              </div>
              <div class="reasoning-row">{{ settleCheck.reasoning }}</div>
              <div class="settle-actions" *ngIf="settleCheck.recommendedResult !== 'cannot_determine'">
                <button mat-raised-button color="primary" (click)="confirmAiSettle(settleCheck.recommendedResult)">
                  Confirm {{ settleCheck.recommendedResult }}
                </button>
                <button mat-button (click)="settleCheck = null">Dismiss</button>
              </div>
            </div>
          </div>
          <div class="settle-form" *ngIf="settleTarget">
            <h4>Settle Pod</h4>
            <div class="settle-actions">
              <button mat-raised-button color="primary" (click)="confirmSettle('win')">Win</button>
              <button mat-raised-button class="btn-loss" (click)="confirmSettle('loss')">Loss</button>
              <button mat-raised-button class="btn-void" (click)="confirmSettle('void')">Void</button>
              <button mat-button (click)="settleTarget = null">Cancel</button>
            </div>
          </div>
          <div class="legs-list" *ngIf="selectedPod.legs?.length">
            <h4>Legs ({{ selectedPod.legs.length }})</h4>
            <div class="leg-item" *ngFor="let leg of selectedPod.legs; let i = index">
              <span class="leg-num">{{ i + 1 }}</span>
              <span class="leg-teams">{{ leg.homeTeam }} vs {{ leg.awayTeam }}</span>
              <span class="leg-date">{{ leg.matchDate | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ora Curation Panel DISABLED
      <div class="curation-panel" *ngIf="curationResult">
        <div class="curation-header">
          <mat-icon style="color:#CE93D8">auto_awesome</mat-icon>
          <span>Ora Curation: {{ curationResult.recommended }} recommended, {{ curationResult.skipped }} skipped of {{ curationResult.total }}</span>
          <span class="ora-stats" *ngIf="curationResult.oraTotalPods > 0">
            | Ora record: {{ curationResult.oraWon }}/{{ curationResult.oraTotalPods }} won ({{ curationResult.oraWinRate }}%)
            | Threshold: {{ curationResult.confidenceThreshold }}%
          </span>
          <button mat-icon-button (click)="curationResult = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="curation-body">
          <div class="curation-log" *ngIf="curationResult.apiLog.length">
            <div class="curation-log-entry" *ngFor="let a of curationResult.apiLog">{{ a }}</div>
          </div>
          <div class="curation-error" *ngIf="curationResult.errors.length">
            <div *ngFor="let e of curationResult.errors">{{ e }}</div>
          </div>
          <div class="curation-fixtures" *ngIf="curationResult.fixtures.length">
            <div class="curation-fixture" *ngFor="let f of curationResult.fixtures">
              <div class="fixture-header">
                <span class="fixture-teams">{{ f.homeTeam }} vs {{ f.awayTeam }}</span>
                <span class="fixture-league">{{ f.league }}</span>
                <span class="fixture-verdict" [class.recommend]="f.verdict === 'RECOMMEND'" [class.skip]="f.verdict === 'SKIP'">
                  {{ f.verdict }}
                </span>
              </div>
              <div class="fixture-body" *ngIf="f.verdict === 'RECOMMEND' && f.recommendations.length">
                <div class="recommendation-row" *ngFor="let r of f.recommendations">
                  <span class="rec-selection">{{ r.selection }}</span>
                  <span class="rec-confidence">
                    <span class="confidence-bar" [style.width.%]="r.confidence" [style.background]="confidenceColor(r.confidence)"></span>
                    {{ r.confidence }}%
                  </span>
                  <span class="rec-multiplier">{{ r.recommendedMultiplier }}x</span>
                  <span class="rec-reasoning">{{ r.reasoning }}</span>
                </div>
                <div class="combined-info" *ngIf="f.isCombined && f.combinedLegs as cls">
                  <div class="combined-label">Parlay: {{ cls[0].selection }} ({{ cls[0].multiplier }}x) + {{ cls[1].selection }} ({{ cls[1].multiplier }}x) = {{ f.multiplier }}x</div>
                </div>
                <div class="fixture-action">
                  <button mat-stroked-button class="btn-create-from-curation" (click)="createFromRecommendation(f)">
                    <mat-icon>add_circle</mat-icon> Create {{ f.isCombined ? 'Parlay' : f.selection }} Pod
                  </button>
                </div>
              </div>
              <div class="fixture-skip-reason" *ngIf="f.verdict === 'SKIP'">{{ f.overallReasoning }}</div>
            </div>
          </div>
        </div>
      </div>
      -->
      <div class="settle-all-panel" *ngIf="settleAllResult">
        <div class="settle-all-header">
          <mat-icon [style.color]="settleAllResult.errors.length === 0 ? '#00E676' : '#E8B923'">fact_check</mat-icon>
          <span>AI Settle All: {{ settleAllResult.settled }} settled
            <span *ngIf="settleAllResult.disputed > 0" class="disputed-badge">{{ settleAllResult.disputed }} disputed</span>
            <span *ngIf="settleAllResult.stuck > 0" class="stuck-badge">{{ settleAllResult.stuck }} need review</span>
          </span>
          <button mat-icon-button (click)="settleAllResult = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="settle-all-body">
          <div class="settle-all-error" *ngFor="let e of settleAllResult.errors">{{ e }}</div>
          <div class="settle-all-item" *ngFor="let r of settleAllResult.results.slice(0, 10)">
            <span class="settle-item-teams">{{ r.homeTeam }} vs {{ r.awayTeam }}</span>
            <span class="settle-item-verdict" [class.win]="r.recommendedResult === 'win'" [class.loss]="r.recommendedResult === 'loss'" [class.disputed]="r.disputed" [class.stuck]="r.recommendedResult === 'cannot_determine' && !r.disputed" [class.unknown]="r.recommendedResult === 'cannot_determine'">
              <span *ngIf="r.disputed">DISPUTED</span>
              <span *ngIf="!r.disputed && r.recommendedResult === 'cannot_determine'">STUCK</span>
              <span *ngIf="!r.disputed && r.recommendedResult !== 'cannot_determine'">{{ r.recommendedResult }}</span>
            </span>
          </div>
          <div class="settle-more" *ngIf="settleAllResult.results.length > 10">+{{ settleAllResult.results.length - 10 }} more</div>
          <div class="settle-all-actions">
            <button mat-stroked-button class="btn-dispute-review" *ngIf="settleAllResult.disputed > 0" (click)="loadDisputed()">
              <mat-icon>gavel</mat-icon> Review {{ settleAllResult.disputed }} Disputed
            </button>
            <button mat-stroked-button class="btn-stuck-review" *ngIf="settleAllResult.stuck > 0" (click)="loadStuck()">
              <mat-icon>help_outline</mat-icon> Review {{ settleAllResult.stuck }} Stuck
            </button>
          </div>
        </div>
      </div>

      <div class="disputed-panel" *ngIf="showDisputedPanel">
        <div class="disputed-header">
          <mat-icon style="color:#E8B923">gavel</mat-icon>
          <span>Disputed Settlements ({{ disputedPods.length }})</span>
          <div class="disputed-header-actions">
            <button mat-stroked-button class="btn-batch-resolve" *ngIf="selectedDisputedIds.size > 0" (click)="startBatchResolve()">
              <mat-icon>done_all</mat-icon> Resolve {{ selectedDisputedIds.size }} Selected
            </button>
            <button mat-icon-button (click)="showDisputedPanel = false; disputedPods = []"><mat-icon>close</mat-icon></button>
          </div>
        </div>
        <div class="disputed-body">
          <div class="disputed-empty" *ngIf="disputedPods.length === 0">No disputed settlements.</div>
          <div class="disputed-item" *ngFor="let p of disputedPods" [class.selected]="selectedDisputedIds.has(p._id || p.id)">
            <div class="disputed-item-header">
              <mat-checkbox class="disputed-checkbox" (change)="toggleDisputedSelection(p._id || p.id)" [checked]="selectedDisputedIds.has(p._id || p.id)"></mat-checkbox>
              <span class="disputed-teams">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
              <span class="disputed-selection">{{ p.selection }} ({{ p.gainsMultiplier }}x)</span>
            </div>
            <div class="disputed-reason">{{ p.settlementDisputedReason || 'No reason provided' }}</div>
            <div class="disputed-actions">
              <button mat-stroked-button class="btn-resolve" (click)="startResolveDispute(p)">Resolve</button>
            </div>
          </div>
        </div>
      </div>

      <div class="stuck-panel" *ngIf="showStuckPanel">
        <div class="stuck-header">
          <mat-icon style="color:#90CAF9">help_outline</mat-icon>
          <span>Needs Review — No Linked Fixture ({{ stuckPods.length }})</span>
          <button mat-icon-button (click)="showStuckPanel = false; stuckPods = []"><mat-icon>close</mat-icon></button>
        </div>
        <div class="stuck-body">
          <div class="stuck-empty" *ngIf="stuckPods.length === 0">All pods have linked fixtures.</div>
          <div class="stuck-item" *ngFor="let p of stuckPods">
            <div class="stuck-item-header">
              <span class="stuck-teams">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
              <span class="stuck-selection">{{ p.selection }} ({{ p.gainsMultiplier }}x)</span>
            </div>
            <div class="stuck-reason">No linked fixture — cannot auto-settle. Settle manually using the pod detail panel.</div>
            <div class="stuck-actions">
              <button mat-stroked-button class="btn-settle-manual" (click)="selectPodAndSettle(p)">Manual Settle</button>
            </div>
          </div>
        </div>
      </div>

      <div class="resolve-modal" *ngIf="resolveTarget">
        <div class="resolve-overlay" (click)="cancelResolveDispute()"></div>
        <div class="resolve-card">
          <div class="resolve-header">
            <h3>Resolve Dispute</h3>
            <button mat-icon-button (click)="cancelResolveDispute()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="resolve-body">
            <p class="resolve-pod-title">{{ resolveTarget.pod.homeTeam }} vs {{ resolveTarget.pod.awayTeam }}</p>
            <p class="resolve-dispute-reason">{{ resolveTarget.pod.settlementDisputedReason }}</p>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Override Result</mat-label>
              <mat-select [(ngModel)]="resolveTarget.result" required>
                <mat-option value="win">Win</mat-option>
                <mat-option value="loss">Loss</mat-option>
                <mat-option value="void">Void</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Review Note (required)</mat-label>
              <textarea matInput [(ngModel)]="resolveTarget.note" rows="3" required placeholder="Explain why this override was made..."></textarea>
            </mat-form-field>
            <div class="resolve-actions">
              <button mat-button (click)="cancelResolveDispute()">Cancel</button>
              <button mat-raised-button color="primary" (click)="confirmResolveDispute()"
                [disabled]="!resolveTarget.result || !resolveTarget.note.trim()">
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="resolve-modal" *ngIf="batchResolveTarget">
        <div class="resolve-overlay" (click)="cancelBatchResolve()"></div>
        <div class="resolve-card">
          <div class="resolve-header">
            <h3>Batch Resolve ({{ batchResolveTarget.podIds.length }} pods)</h3>
            <button mat-icon-button (click)="cancelBatchResolve()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="resolve-body">
            <p class="resolve-info">Apply the same result and note to all {{ batchResolveTarget.podIds.length }} selected disputed pods.</p>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Override Result</mat-label>
              <mat-select [(ngModel)]="batchResolveTarget.result" required>
                <mat-option value="win">Win</mat-option>
                <mat-option value="loss">Loss</mat-option>
                <mat-option value="void">Void</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Review Note (required)</mat-label>
              <textarea matInput [(ngModel)]="batchResolveTarget.note" rows="3" required placeholder="Explain why this override was made..."></textarea>
            </mat-form-field>
            <div class="resolve-actions">
              <button mat-button (click)="cancelBatchResolve()">Cancel</button>
              <button mat-raised-button color="primary" (click)="confirmBatchResolve()"
                [disabled]="!batchResolveTarget.result || !batchResolveTarget.note.trim()">
                Batch Resolve {{ batchResolveTarget.podIds.length }} Pods
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="sync-result" *ngIf="syncResult">
        <div class="sync-header">
          <mat-icon [style.color]="syncResult.success ? '#00E676' : '#f44336'">{{ syncResult.success ? 'check_circle' : 'error' }}</mat-icon>
          <span>Sync: {{ syncResult.created }} pods created ({{ syncResult.skipped }} skipped)</span>
          <button mat-icon-button (click)="syncResult = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="sync-details" *ngIf="syncResult.details.length">
          <div class="sync-log" *ngFor="let d of syncResult.details">{{ d }}</div>
        </div>
        <div class="sync-details" *ngIf="syncResult.apiLog.length">
          <div class="sync-section-label">API calls</div>
          <div class="sync-log" *ngFor="let a of syncResult.apiLog">{{ a }}</div>
        </div>
        <div class="sync-details" *ngIf="syncResult.errors.length">
          <div class="sync-section-label">Errors</div>
          <div class="sync-error" *ngFor="let e of syncResult.errors">{{ e }}</div>
        </div>
        <div class="sync-details" *ngIf="syncResult.successes.length">
          <div class="sync-section-label">Created pods</div>
          <div class="sync-success-item" *ngFor="let s of syncResult.successes.slice(0, 5)">
            {{ s.homeTeam }} vs {{ s.awayTeam }} &mdash; {{ s.pods }} pods
          </div>
          <div class="sync-more" *ngIf="syncResult.successes.length > 5">+{{ syncResult.successes.length - 5 }} more</div>
        </div>
      </div>

      <div class="reserve-bar" *ngIf="reserve">
        <div class="reserve-header">
          <div class="reserve-title">
            <mat-icon style="font-size:18px;color:#E8B923">account_balance</mat-icon>
            <span>Reserve Risk</span>
            <span class="reserve-amount">₦{{ reserve.reserveAmount | number }}</span>
          </div>
          <div class="reserve-stats">
            <span class="stat" [class.text-green]="reserve.netIfAllLose >= 0" [class.text-red]="reserve.netIfAllLose < 0">
              If all lose: <strong>₦{{ reserve.refundIfAllLose | number }}</strong> refunds
              <span class="net-badge" [class.positive]="reserve.netIfAllLose >= 0" [class.negative]="reserve.netIfAllLose < 0">
                net +₦{{ reserve.netIfAllLose | number }}
              </span>
            </span>
            <span class="stat-divider">|</span>
            <span class="stat" [class.text-green]="reserve.netIfAllWin >= 0" [class.text-red]="reserve.netIfAllWin < 0">
              If all win: <strong>₦{{ reserve.payoutIfAllWin | number }}</strong> payouts
              <span class="net-badge" [class.positive]="reserve.netIfAllWin >= 0" [class.negative]="reserve.netIfAllWin < 0">
                net {{ reserve.netIfAllWin >= 0 ? '+' : '' }}₦{{ reserve.netIfAllWin | number }}
              </span>
            </span>
            <span class="stat-divider">|</span>
            <span class="stat">{{ reserve.activePodsCount }} active pod{{ reserve.activePodsCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="reserve-bar-track">
          <div class="reserve-bar-fill" [style.width.%]="reserve.consumptionPercent" [class.danger]="reserve.consumptionPercent >= 75" [class.warning]="reserve.consumptionPercent >= 50 && reserve.consumptionPercent < 75" [class.safe]="reserve.consumptionPercent < 50">
            <span class="bar-label" *ngIf="reserve.consumptionPercent >= 15">{{ reserve.consumptionPercent }}%</span>
          </div>
        </div>
        <div class="reserve-bar-ticks">
          <span>₦0</span>
          <span>₦250K</span>
          <span>₦500K</span>
          <span>₦750K</span>
          <span>₦1M</span>
        </div>
      </div>

      <div class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <div class="empty-state" *ngIf="!loading && tabPods.length === 0 && activeTab !== 'disputed'">
          <mat-icon style="font-size:40px;opacity:0.25;margin-bottom:8px">sports_soccer</mat-icon>
          <div>No {{ activeTab }} pods to show</div>
        </div>
        <table mat-table [dataSource]="tabPods" class="admin-table" *ngIf="tabPods.length > 0">
          <ng-container matColumnDef="match">
            <th mat-header-cell *matHeaderCellDef>Match</th>
            <td mat-cell *matCellDef="let p">
              <div class="match-cell">
                <span class="match-teams">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
                <span class="match-date">{{ p.matchDate | date:'MMM d, HH:mm' }}</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <div class="status-group">
                <span class="chip" [style.background]="statusColor(p.status)">{{ p.status }}</span>
                <span class="chip settlement" *ngIf="p.settlementStatus" [style.background]="settlementColor(p)">{{ p.settlementStatus }}</span>
                <span class="live-pill" *ngIf="p.isLive">LIVE</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="pick">
            <th mat-header-cell *matHeaderCellDef>Pick</th>
            <td mat-cell *matCellDef="let p">
              <span class="pick-value">{{ p.selection }}</span>
              <span class="pick-odds">{{ p.gainsMultiplier }}x</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="exposure">
            <th mat-header-cell *matHeaderCellDef>Exposure</th>
            <td mat-cell *matCellDef="let p">
              <div class="exposure-cell">
                <span class="exposure-amount">\u20A6{{ p.currentExposure | number }} / \u20A6{{ p.maxTotalExposure | number }}</span>
                <div class="exposure-track">
                  <div class="exposure-fill" [style.width.%]="getExposurePercent(p)" [style.background]="getExposurePercent(p) >= 80 ? '#f44336' : getExposurePercent(p) >= 50 ? '#E8B923' : '#00E676'"></div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="stakeRange">
            <th mat-header-cell *matHeaderCellDef>Range</th>
            <td mat-cell *matCellDef="let p" class="range-cell">\u20A6{{ p.minStake | number }} – \u20A6{{ p.maxStake | number }}</td>
          </ng-container>
          <ng-container matColumnDef="refund">
            <th mat-header-cell *matHeaderCellDef>Refund</th>
            <td mat-cell *matCellDef="let p">
              <span *ngIf="p.refundPercent != null" style="color:#E8B923;font-weight:600">{{ p.refundPercent }}%</span>
              <span *ngIf="p.refundPercent == null" style="color:rgba(255,255,255,0.3)">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <div class="row-actions">
                <button mat-icon-button (click)="viewPodDialog(p); $event.stopPropagation()" matTooltip="Details"><mat-icon>visibility</mat-icon></button>
                <button mat-icon-button (click)="editPod(p); $event.stopPropagation()" matTooltip="Edit" *ngIf="canManage(p)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button *ngIf="p.status === 'draft'" (click)="publishPod(p.id); $event.stopPropagation()" matTooltip="Publish"><mat-icon>publish</mat-icon></button>
                <button mat-icon-button *ngIf="p.status === 'published'" (click)="activatePod(p.id); $event.stopPropagation()" matTooltip="Activate"><mat-icon>play_arrow</mat-icon></button>
                <button mat-icon-button *ngIf="['published','active'].includes(p.status) && activeTab !== 'past'" (click)="startSettle(); $event.stopPropagation()" matTooltip="Settle"><mat-icon>check_circle</mat-icon></button>
                <button mat-icon-button *ngIf="canManage(p)" (click)="cancelPod(p.id); $event.stopPropagation()" matTooltip="Cancel"><mat-icon>cancel</mat-icon></button>
              </div>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="tabColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: tabColumns;" class="clickable-row" [class.past-row]="activeTab === 'past' || isMatchPassed(row)" [class.active-row]="activeTab === 'active' && !isMatchPassed(row)" (click)="selectAndFetch(row)"></tr>
        </table>
        <mat-paginator *ngIf="totalPages > 1"
          [length]="total"
          [pageSize]="limit"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 20, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>

    <div class="detail-dialog" *ngIf="detailDialogPod">
      <div class="detail-overlay" (click)="detailDialogPod = null"></div>
      <div class="detail-dialog-card">
        <div class="detail-dialog-header">
          <h3>{{ detailDialogPod.title }}</h3>
          <div class="detail-dialog-header-meta">
            <span class="chip" [style.background]="statusColor(detailDialogPod.status)">{{ detailDialogPod.status }}</span>
            <span class="chip" style="background:#2196f3" *ngIf="detailDialogPod.settlementStatus">{{ detailDialogPod.settlementStatus }}</span>
          </div>
          <button class="detail-dialog-close" (click)="detailDialogPod = null">&times;</button>
        </div>
        <div class="detail-dialog-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Match</span>
              <span class="value">{{ detailDialogPod.homeTeam }} vs {{ detailDialogPod.awayTeam }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Match Date</span>
              <span class="value">{{ detailDialogPod.matchDate | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Sport</span>
              <span class="value">{{ detailDialogPod.sport }}</span>
            </div>
            <div class="detail-item">
              <span class="label">League</span>
              <span class="value">{{ detailDialogPod.league || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Market Type</span>
              <span class="value">{{ detailDialogPod.marketType || '1X2' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Selection</span>
              <span class="value" style="color:#00E676;font-weight:600">{{ detailDialogPod.selection }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Adj. Odds</span>
              <span class="value" style="color:#E8B923;font-size:18px;font-weight:700">{{ detailDialogPod.gainsMultiplier }}x</span>
            </div>
            <div class="detail-item" *ngIf="detailDialogPod.marketOdds != null">
              <span class="label">Market Odds</span>
              <span class="value" style="color:rgba(255,255,255,0.6);font-size:16px">{{ detailDialogPod.marketOdds }}x</span>
            </div>
            <div class="detail-item" *ngIf="detailDialogPod.refundPercent != null">
              <span class="label">Refund %</span>
              <span class="value" style="color:#E8B923;font-size:16px;font-weight:600">{{ detailDialogPod.refundPercent }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Stake Range</span>
              <span class="value">\u20A6{{ detailDialogPod.minStake | number }} – \u20A6{{ detailDialogPod.maxStake | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Total Staked</span>
              <span class="value">\u20A6{{ detailDialogPod.currentExposure | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Max Exposure</span>
              <span class="value">\u20A6{{ detailDialogPod.maxTotalExposure | number }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Participants</span>
              <span class="value">{{ detailDialogPod.currentParticipants }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Staking Opens</span>
              <span class="value">{{ detailDialogPod.opensAt | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Staking Closes</span>
              <span class="value" [style.color]="isStakingClosed(detailDialogPod) ? '#f44336' : '#00E676'">{{ detailDialogPod.stakingClosesAt | date:'MMM d, y HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Est. Settlement</span>
              <span class="value">{{ detailDialogPod.settlementEstimateLabel || (detailDialogPod.settlementEstimateAt | date:'MMM d, y') }}</span>
            </div>
          </div>
          <div class="detail-dialog-actions" *ngIf="canManage(detailDialogPod)">
            <button mat-stroked-button class="action-publish" *ngIf="detailDialogPod.status === 'draft'" (click)="publishPod(detailDialogPod.id)">
              <mat-icon>publish</mat-icon> Publish
            </button>
            <button mat-stroked-button class="action-activate" *ngIf="detailDialogPod.status === 'published'" (click)="activatePod(detailDialogPod.id)">
              <mat-icon>play_arrow</mat-icon> Activate
            </button>
            <button mat-stroked-button class="action-settle" *ngIf="detailDialogPod.status === 'active' || detailDialogPod.status === 'published'" (click)="startSettle()">
              <mat-icon>check_circle</mat-icon> Settle
            </button>
            <button mat-stroked-button class="action-cancel" *ngIf="['draft','published','active'].includes(detailDialogPod.status)" (click)="cancelPod(detailDialogPod.id)">
              <mat-icon>cancel</mat-icon> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <app-pod-form *ngIf="showCreateForm || editPodTarget"
      [pod]="editPodTarget"
      (close)="showCreateForm = false; editPodTarget = null"
      (saved)="onPodSaved($event)" />
  `,
  styles: [`
    .pods-page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .page-header-left { display: flex; align-items: center; gap: 20px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: 10px; }
    .btn-create { background: #00E676 !important; color: #0A1428 !important; font-weight: 600; }
    .btn-sync { color: #90caf9 !important; border-color: #90caf9 !important; }
    .btn-settle-all { color: #81D4FA !important; border-color: #81D4FA !important; }
    .stat-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-item { font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 20px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
    .stat-item.draft-dot { border-left: 3px solid #555; }
    .stat-item.pub-dot { border-left: 3px solid #E8B923; }
    .stat-item.act-dot { border-left: 3px solid #00E676; }
    .stat-item.past-dot { border-left: 3px solid rgba(255,255,255,0.2); }
    .filter-bar { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 0; overflow: hidden; }
    .tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .tab-btn { display: flex; align-items: center; gap: 6px; padding: 12px 20px; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab-btn:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.03); }
    .tab-btn.active { color: #00E676; border-bottom-color: #00E676; background: rgba(0,230,118,0.04); }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-badge { background: rgba(0,230,118,0.15); color: #00E676; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px; margin-left: 2px; }
    .tab-badge.warn { background: rgba(232,185,35,0.15); color: #E8B923; }
    .filter-controls { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
    .search-wrapper { flex: 1; display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 0 12px; max-width: 320px; }
    .search-icon { font-size: 18px; color: rgba(255,255,255,0.3); }
    .search-input { background: none; border: none; color: #fff; padding: 8px 8px; font-size: 13px; outline: none; width: 100%; }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }
    .date-range { display: flex; align-items: center; gap: 4px; }
    .date-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; padding: 5px 8px; font-size: 12px; font-family: inherit; outline: none; width: 130px; color-scheme: dark; }
    .date-input::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
    .date-sep { color: rgba(255,255,255,0.3); font-size: 13px; }
    .date-clear { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; line-height: 1; }
    .date-clear:hover { color: #f44336; background: rgba(244,67,54,0.1); }
    .sub-filters { display: flex; gap: 4px; flex-wrap: wrap; }
    .sub-chip { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; padding: 4px 10px; border-radius: 16px; cursor: pointer; transition: all 0.15s; font-weight: 500; }
    .sub-chip:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }
    .sub-chip.active { color: #fff; background: rgba(255,255,255,0.1); }
    .sub-chip.draft.active { background: rgba(85,85,85,0.3); color: #ccc; }
    .sub-chip.published.active { background: rgba(232,185,35,0.2); color: #E8B923; }
    .sub-chip.active.active { background: rgba(0,230,118,0.15); color: #00E676; }
    .sub-chip.settled.active { background: rgba(33,150,243,0.15); color: #2196f3; }
    .sub-chip.cancelled.active { background: rgba(244,67,54,0.15); color: #f44336; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.45) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.5px; border-bottom-color: rgba(255,255,255,0.06) !important; background: transparent !important; padding: 12px 12px !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.85) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.04) !important; background: transparent !important; padding: 10px 12px !important; }
    ::ng-deep .mat-mdc-paginator { background: transparent !important; color: rgba(255,255,255,0.7) !important; border-top: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .mat-mdc-paginator .mat-mdc-paginator-navigation-button { color: rgba(255,255,255,0.6) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-select-value-text { color: rgba(255,255,255,0.7) !important; }
    .clickable-row { cursor: pointer; transition: background 0.15s; }
    .clickable-row.active-row:hover { background: rgba(0,230,118,0.04) !important; }
    .clickable-row.past-row { opacity: 0.6; }
    .clickable-row.past-row:hover { opacity: 0.85; background: rgba(255,255,255,0.02) !important; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; display: inline-block; }
    .chip.settlement { font-size: 10px; padding: 1px 7px; }
    .empty-state { padding: 48px 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; display: flex; flex-direction: column; align-items: center; }
    .loading-shim { position: absolute; inset: 0; background: rgba(10,20,40,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .match-cell { display: flex; flex-direction: column; gap: 2px; }
    .match-teams { color: #fff; font-size: 13px; font-weight: 500; }
    .match-date { color: rgba(255,255,255,0.35); font-size: 11px; }
    .status-group { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .live-pill { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px; background: rgba(244,67,54,0.2); color: #f44336; animation: pulse-live 1.5s ease-in-out infinite; text-transform: uppercase; }
    @keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .pick-value { color: #00E676; font-weight: 600; }
    .pick-odds { color: #E8B923; font-size: 12px; font-weight: 600; margin-left: 8px; }
    .exposure-cell { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .exposure-amount { font-size: 12px; color: rgba(255,255,255,0.7); }
    .exposure-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; width: 100%; max-width: 140px; }
    .exposure-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
    .range-cell { color: rgba(255,255,255,0.55) !important; font-size: 12px !important; }
    .row-actions { display: flex; gap: 2px; align-items: center; }
    ::ng-deep .row-actions .mat-mdc-icon-button { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
    ::ng-deep .row-actions .mat-mdc-icon-button .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .pod-detail-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .panel-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .panel-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .panel-header-meta { display: flex; gap: 6px; margin-left: auto; }
    .panel-header button { color: rgba(255,255,255,0.5); }
    .panel-body { padding: 16px 20px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-item .label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; }
    .detail-item .value { font-size: 15px; color: #fff; font-weight: 500; }
    .exposure-bar-bg { width: 100%; max-width: 120px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .exposure-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .confidence-badge { padding: 2px 10px; border-radius: 10px; font-size: 13px; font-weight: 700; }
    .detail-actions { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .action-publish { color: #00E676 !important; border-color: #00E676 !important; }
    .action-activate { color: #E8B923 !important; border-color: #E8B923 !important; }
    .action-settle { color: #2196f3 !important; border-color: #2196f3 !important; }
    .action-cancel { color: #f44336 !important; border-color: #f44336 !important; }
    .settle-form { margin: 12px 0; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .settle-form h4 { color: #fff; margin: 0 0 8px; font-size: 14px; }
    .settle-actions { display: flex; gap: 8px; }
    .btn-loss { background: #f44336 !important; }
    .btn-void { background: #666 !important; }
    .legs-list h4 { color: #fff; font-size: 14px; margin: 12px 0 8px; }
    .leg-item { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .leg-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(0,230,118,0.15); color: #00E676; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .leg-teams { color: #fff; font-size: 13px; flex: 1; }
    .leg-date { color: rgba(255,255,255,0.4); font-size: 12px; }
    .sync-result { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; overflow: hidden; }
    .sync-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; }
    .sync-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .sync-details { padding: 8px 16px 12px; }
    .sync-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .sync-log { color: rgba(255,255,255,0.5); font-size: 11px; padding: 1px 0; font-family: monospace; }
    .sync-section-label { color: rgba(255,255,255,0.3); font-size: 10px; text-transform: uppercase; font-weight: 600; margin: 8px 0 4px; letter-spacing: 1px; }
    .sync-success-item { color: rgba(255,255,255,0.7); font-size: 12px; padding: 2px 0; }
    .sync-more { color: rgba(255,255,255,0.4); font-size: 12px; padding: 2px 0; font-style: italic; }
    .btn-curate { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .curation-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(206,147,216,0.25); margin-bottom: 16px; overflow: hidden; }
    .curation-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; flex-wrap: wrap; }
    .curation-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ora-stats { color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 400; }
    .combined-info { padding: 6px 12px; margin: 4px 0; background: rgba(206,147,216,0.08); border-radius: 6px; font-size: 12px; color: #CE93D8; }
    .combined-label { font-weight: 500; }
    .curation-body { padding: 8px 16px 12px; max-height: 600px; overflow-y: auto; }
    .curation-log-entry { color: rgba(255,255,255,0.4); font-size: 11px; padding: 1px 0; font-family: monospace; }
    .curation-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .curation-fixtures { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .curation-fixture { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .fixture-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .fixture-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .fixture-league { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; }
    .fixture-verdict { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; margin-left: auto; }
    .fixture-verdict.recommend { background: rgba(0,230,118,0.15); color: #00E676; }
    .fixture-verdict.skip { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
    .fixture-body { margin-top: 8px; }
    .recommendation-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; flex-wrap: wrap; }
    .rec-selection { color: #fff; font-weight: 500; min-width: 80px; }
    .rec-confidence { color: rgba(255,255,255,0.7); min-width: 120px; display: flex; align-items: center; gap: 6px; }
    .confidence-bar { height: 6px; border-radius: 3px; width: 60px; display: inline-block; }
    .rec-multiplier { color: #CE93D8; font-weight: 600; min-width: 40px; }
    .rec-reasoning { color: rgba(255,255,255,0.5); font-size: 11px; flex: 1; min-width: 120px; }
    .fixture-action { margin-top: 8px; }
    .btn-create-from-curation { color: #CE93D8 !important; border-color: #CE93D8 !important; font-size: 12px !important; }
    .fixture-skip-reason { color: rgba(255,255,255,0.35); font-size: 11px; font-style: italic; }
    .action-ai-settle { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .action-settle-all { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .btn-settle-all { color: #81D4FA !important; border-color: #81D4FA !important; }
    .disputed-badge { background: #E8B923; color: #0A1428; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 8px; margin-left: 8px; }
    .settle-item-verdict.disputed { background: rgba(232,185,35,0.15); color: #E8B923; padding: 1px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .btn-dispute-review { color: #E8B923 !important; border-color: #E8B923 !important; margin-top: 8px; }
    .disputed-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(232,185,35,0.3); margin-bottom: 16px; overflow: hidden; }
    .disputed-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; }
    .disputed-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .disputed-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .disputed-empty { color: rgba(255,255,255,0.3); font-size: 13px; padding: 16px; text-align: center; }
    .disputed-item { background: rgba(232,185,35,0.05); border: 1px solid rgba(232,185,35,0.15); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .disputed-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px; }
    .disputed-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .disputed-selection { color: rgba(255,255,255,0.5); font-size: 12px; }
    .disputed-reason { color: #E8B923; font-size: 12px; margin-bottom: 8px; line-height: 1.4; }
    .disputed-actions { display: flex; gap: 8px; }
    .btn-resolve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .stuck-badge { background: #90CAF9; color: #0A1428; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 8px; margin-left: 8px; }
    .settle-item-verdict.stuck { background: rgba(144,202,249,0.15); color: #90CAF9; padding: 1px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .btn-stuck-review { color: #90CAF9 !important; border-color: #90CAF9 !important; margin-top: 8px; margin-left: 8px; }
    .stuck-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(144,202,249,0.3); margin-bottom: 16px; overflow: hidden; }
    .stuck-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; }
    .stuck-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .stuck-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .stuck-empty { color: rgba(255,255,255,0.3); font-size: 13px; padding: 16px; text-align: center; }
    .stuck-item { background: rgba(144,202,249,0.05); border: 1px solid rgba(144,202,249,0.15); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .stuck-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px; }
    .stuck-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .stuck-selection { color: rgba(255,255,255,0.5); font-size: 12px; }
    .stuck-reason { color: #90CAF9; font-size: 12px; margin-bottom: 8px; line-height: 1.4; }
    .stuck-actions { display: flex; gap: 8px; }
    .btn-settle-manual { color: #90CAF9 !important; border-color: #90CAF9 !important; font-size: 12px !important; }
    .disputed-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .btn-batch-resolve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .disputed-item.selected { background: rgba(0,230,118,0.08); border-color: #00E676; }
    .disputed-checkbox { margin-right: 8px; }
    ::ng-deep .disputed-checkbox .mat-mdc-checkbox-touch-target { width: 20px; height: 20px; }
    ::ng-deep .disputed-checkbox.mdc-checkbox .mdc-checkbox__native-control { width: 20px; height: 20px; }
    .resolve-info { color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 8px; }
    .resolve-modal { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .resolve-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); }
    .resolve-card { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 480px; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1; }
    .resolve-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .resolve-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .resolve-header button { color: rgba(255,255,255,0.5); }
    .resolve-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .resolve-pod-title { color: #fff; font-size: 15px; font-weight: 500; margin: 0; }
    .resolve-dispute-reason { color: #E8B923; font-size: 12px; margin: 0; }
    .resolve-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
    .ai-settle-panel { background: rgba(206,147,216,0.08); border: 1px solid rgba(206,147,216,0.2); border-radius: 8px; margin: 12px 0; overflow: hidden; }
    .ai-settle-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 13px; font-weight: 500; }
    .ai-settle-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ai-settle-body { padding: 12px 14px; }
    .ai-settle-result { margin-bottom: 8px; }
    .score-row { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .score-row strong { color: #00E676; font-size: 20px; }
    .status-row { color: rgba(255,255,255,0.5); font-size: 12px; margin-bottom: 8px; }
    .match-status { text-transform: capitalize; }
    .no-data { color: rgba(255,255,255,0.4); font-size: 12px; }
    .verdict-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .verdict-label { color: rgba(255,255,255,0.5); font-size: 12px; }
    .verdict-value { font-size: 14px; font-weight: 700; padding: 2px 10px; border-radius: 4px; }
    .verdict-value.win { background: rgba(0,230,118,0.15); color: #00E676; }
    .verdict-value.loss { background: rgba(244,67,54,0.15); color: #f44336; }
    .verdict-value.void { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .verdict-value.unknown { background: rgba(255,152,0,0.15); color: #FF9800; }
    .verdict-confidence { color: rgba(255,255,255,0.4); font-size: 11px; }
    .reasoning-row { color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; line-height: 1.4; }
    .settle-actions { display: flex; gap: 8px; }
    .settle-all-panel { background: rgba(129,212,250,0.08); border: 1px solid rgba(129,212,250,0.2); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .settle-all-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; }
    .settle-all-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .settle-all-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .settle-all-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .settle-all-item { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .settle-item-teams { color: rgba(255,255,255,0.7); font-size: 12px; }
    .settle-item-verdict { font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 3px; }
    .settle-item-verdict.win { color: #00E676; }
    .settle-item-verdict.loss { color: #f44336; }
    .settle-item-verdict.unknown { color: #FF9800; }
    .settle-more { color: rgba(255,255,255,0.3); font-size: 11px; padding: 4px 0; font-style: italic; }
    .reserve-bar { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; padding: 16px 20px; }
    .reserve-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .reserve-title { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 600; }
    .reserve-amount { color: #E8B923; font-size: 16px; font-weight: 700; margin-left: auto; }
    .reserve-stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: rgba(255,255,255,0.6); }
    .stat-divider { color: rgba(255,255,255,0.15); }
    .text-green { color: #00E676; }
    .text-red { color: #f44336; }
    .net-badge { font-size: 10px; padding: 1px 6px; border-radius: 6px; margin-left: 4px; font-weight: 600; }
    .net-badge.positive { background: rgba(0,230,118,0.12); color: #00E676; }
    .net-badge.negative { background: rgba(244,67,54,0.12); color: #f44336; }
    .reserve-bar-track { height: 20px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; position: relative; }
    .reserve-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; min-width: 0; }
    .reserve-bar-fill.safe { background: linear-gradient(90deg, #00E676, #00C853); }
    .reserve-bar-fill.warning { background: linear-gradient(90deg, #E8B923, #FFA000); }
    .reserve-bar-fill.danger { background: linear-gradient(90deg, #f44336, #D32F2F); }
    .bar-label { color: #fff; font-size: 11px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .reserve-bar-ticks { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: rgba(255,255,255,0.25); padding: 0 2px; }
    .detail-dialog { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .detail-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); }
    .detail-dialog-card { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 600px; max-height: 85vh; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1; display: flex; flex-direction: column; overflow: hidden; }
    .detail-dialog-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
    .detail-dialog-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .detail-dialog-header-meta { display: flex; gap: 6px; flex-shrink: 0; }
    .detail-dialog-close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 24px; cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0; }
    .detail-dialog-close:hover { color: #f44336; }
    .detail-dialog-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .detail-dialog-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
  `]
})
export class PodsComponent implements OnInit, OnDestroy {
  pods: AdminPod[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  searchQuery = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  selectedPod: AdminPod | null = null;
  detailDialogPod: AdminPod | null = null;
  showCreateForm = false;
  editPodTarget: AdminPod | null = null;
  settleTarget: AdminPod | null = null;
  loading = false;
  syncing = false;
  reserve: ReserveConsumption | null = null;
  syncResult: { success: boolean; created: number; skipped: number; details: string[]; errors: string[]; apiLog: string[]; successes: Array<{ fixtureId: number; homeTeam: string; awayTeam: string; pods: number }> } | null = null;
  curating = false;
  curationResult: CurationResponse | null = null;
  checkingSettle = false;
  settleCheck: SettlementCheckResult | null = null;
  settlingAll = false;
  settleAllResult: { settled: number; disputed: number; stuck: number; errors: string[]; results: SettlementCheckResult[] } | null = null;
  disputedPods: AdminPod[] = [];
  showDisputedPanel = false;
  resolveTarget: { pod: AdminPod; result: string; note: string } | null = null;
  stuckPods: AdminPod[] = [];
  showStuckPanel = false;
  batchResolveTarget: { podIds: string[]; result: string; note: string } | null = null;
  selectedDisputedIds = new Set<string>();
  tabColumns = ['match', 'status', 'pick', 'exposure', 'stakeRange', 'refund', 'actions'];
  activeTab: 'active' | 'past' | 'disputed' = 'active';
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  constructor(private admin: AdminService) {}

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.loadPods();
    });
    this.loadPods();
    this.loadReserve();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPods() {
    this.loading = true;
    this.admin.getPods({ page: this.page, limit: this.limit, status: this.statusFilter || undefined, search: this.searchQuery || undefined, dateFrom: this.dateFrom || undefined, dateTo: this.dateTo || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.pods = res.data.items;
          this.total = res.data.total;
          this.page = res.data.page;
          this.limit = res.data.limit;
          this.totalPages = res.data.totalPages;
          this.loadReserve();
        }
        this.loading = false;
      });
  }

  loadReserve() {
    this.admin.getReserveConsumption().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.reserve = res.data;
    });
  }

  onSearchInput() {
    this.search$.next(this.searchQuery);
  }

  onFilterChange() {
    this.page = 1;
    this.loadPods();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.loadPods();
  }

  selectAndFetch(p: AdminPod) {
    this.admin.getPod(p.id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.selectedPod = res.data;
    });
  }

  viewPodDialog(p: AdminPod) {
    this.admin.getPod(p.id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.detailDialogPod = res.data;
    });
  }

  getExposurePercent(p: AdminPod): number {
    return p.maxTotalExposure > 0 ? Math.round(((p.currentExposure || 0) / p.maxTotalExposure) * 100) : 0;
  }

  isStakingClosed(p: AdminPod): boolean {
    return p.stakingClosesAt ? new Date(p.stakingClosesAt) < new Date() : false;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { draft: '#555', published: '#E8B923', active: '#00E676', settled: '#2196f3', cancelled: '#f44336', void: '#666' };
    return map[s] || '#555';
  }

  canManage(p: AdminPod): boolean {
    return ['draft', 'published', 'active'].includes(p.status);
  }

  editPod(p: AdminPod) {
    this.admin.getPod(p.id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.editPodTarget = res.data;
    });
  }

  publishPod(id: string) {
    this.admin.publishPod(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedPod = null;
      this.detailDialogPod = null;
      this.loadPods();
    });
  }

  activatePod(id: string) {
    this.admin.activatePod(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedPod = null;
      this.detailDialogPod = null;
      this.loadPods();
    });
  }

  startSettle() { this.settleTarget = this.selectedPod; }

  confirmSettle(result: string) {
    const id = this.selectedPod?.id || this.settleTarget?.id;
    if (!id) return;
    this.admin.settlePod(id, result).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.settleTarget = null;
      this.selectedPod = null;
      this.loadPods();
    });
  }

  cancelPod(id: string) {
    this.admin.cancelPod(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedPod = null;
      this.detailDialogPod = null;
      this.loadPods();
    });
  }

  syncFromApi() {
    this.syncing = true;
    this.syncResult = null;
    this.admin.syncPods().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.syncing = false)
    ).subscribe({
      next: res => {
        this.syncResult = res;
        if (res.created > 0) this.loadPods();
      },
      error: () => {
        this.syncResult = { success: false, created: 0, skipped: 0, details: [], errors: ['Failed to connect to sync service'], apiLog: [], successes: [] };
      }
    });
  }

  // runCuration() — DISABLED
  // runCuration() {
  //   this.curating = true;
  //   this.curationResult = null;
  //   this.admin.curatePods().pipe(
  //     takeUntil(this.destroy$),
  //     finalize(() => this.curating = false)
  //   ).subscribe({
  //     next: res => {
  //       this.curationResult = res;
  //     },
  //     error: () => {
  //       this.curationResult = { success: false, total: 0, recommended: 0, skipped: 0, fixtures: [], errors: ['Failed to connect to curation service'], apiLog: [], skippedReason: null, oraWinRate: 0, oraTotalPods: 0, oraWon: 0, confidenceThreshold: 65 };
  //     }
  //   });
  // }

  confidenceColor(c: number): string {
    if (c >= 70) return '#00E676';
    if (c >= 45) return '#E8B923';
    return '#f44336';
  }

  // createFromRecommendation() — DISABLED
  // createFromRecommendation(f: CurationFixture) {
  //   if (!f.selection) return;
  //   this.editPodTarget = null;
  //   this.showCreateForm = false;
  //   let payload: any;
  //   const leg = { homeTeam: f.homeTeam, awayTeam: f.awayTeam, matchDate: f.matchDate, league: f.league };
  //   if (f.isCombined && f.combinedLegs?.length === 2) {
  //     const leg1 = f.combinedLegs[0];
  //     const leg2 = f.combinedLegs[1];
  //     payload = {
  //       title: `${f.homeTeam} vs ${f.awayTeam} (Parlay)`,
  //       sport: 'Football', league: f.league,
  //       homeTeam: f.homeTeam, awayTeam: f.awayTeam,
  //       matchDate: f.matchDate,
  //       marketType: 'Parlay',
  //       selection: `${leg1.selection} + ${leg2.selection}`,
  //       gainsMultiplier: Math.round((leg1.multiplier * leg2.multiplier) * 100) / 100,
  //       minStake: 100, maxStake: 100000, maxTotalExposure: 1000000,
  //       status: 'draft',
  //       legs: [leg, leg],
  //       metadata: { oraCurated: true, fixtureId: f.fixtureId, combined: true, legMarkets: [leg1.marketType, leg2.marketType], legSelections: [leg1.selection, leg2.selection] },
  //     };
  //   } else {
  //     const best = f.recommendations.find(r => r.selection === f.selection) || f.recommendations[0];
  //     if (!best) return;
  //     payload = {
  //       title: `${f.homeTeam} vs ${f.awayTeam}`,
  //       sport: 'Football', league: f.league,
  //       homeTeam: f.homeTeam, awayTeam: f.awayTeam,
  //       matchDate: f.matchDate, marketType: '1X2',
  //       selection: best.selection,
  //       gainsMultiplier: best.recommendedMultiplier,
  //       minStake: 100, maxStake: 100000, maxTotalExposure: 1000000,
  //       status: 'draft', legs: [leg],
  //       metadata: { oraCurated: true, fixtureId: f.fixtureId },
  //     };
  //   }
  //   this.admin.createPod(payload as any).pipe(takeUntil(this.destroy$)).subscribe({
  //     next: res => { if (res.success) this.loadPods(); }
  //   });
  // }

  aiCheckSettle() {
    if (!this.selectedPod) return;
    this.checkingSettle = true;
    this.settleCheck = null;
    this.admin.aiSettleCheck(this.selectedPod.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.settleCheck = res.data;
        this.checkingSettle = false;
      },
      error: () => {
        this.checkingSettle = false;
      }
    });
  }

  confirmAiSettle(result: string) {
    if (!this.selectedPod || !this.settleCheck) return;
    this.admin.aiSettlePod(this.selectedPod.id, result, this.settleCheck.reasoning)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.settleCheck = null;
          this.selectedPod = null;
          this.loadPods();
        }
      });
  }

  aiSettleAll() {
    this.settlingAll = true;
    this.settleAllResult = null;
    this.admin.aiSettleAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.settleAllResult = res;
        this.settlingAll = false;
        if (res.settled > 0) this.loadPods();
      },
      error: () => {
        this.settlingAll = false;
      }
    });
  }

  onPodSaved(p: AdminPod) {
    this.loadPods();
    this.showCreateForm = false;
    this.editPodTarget = null;
  }

  loadDisputed() {
    this.admin.listDisputedSettlements().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.disputedPods = res.data;
        this.showDisputedPanel = true;
      }
    });
  }

  startResolveDispute(pod: AdminPod) {
    this.resolveTarget = { pod, result: '', note: '' };
  }

  confirmResolveDispute() {
    if (!this.resolveTarget || !this.resolveTarget.result || !this.resolveTarget.note.trim()) return;
    const t = this.resolveTarget;
    this.admin.resolveDispute(t.pod._id || t.pod.id, t.result, t.note.trim()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.resolveTarget = null;
        this.loadDisputed();
        this.loadPods();
      },
      error: (err: any) => {
        console.error('Resolve dispute failed:', err);
      }
    });
  }

  cancelResolveDispute() {
    this.resolveTarget = null;
  }

  settlementColor(p: AdminPod): string {
    const s = p.settlementStatus;
    if (s === 'disputed') return '#E8B923';
    if (s === 'settled') return '#00E676';
    if (s === 'reviewed') return '#81D4FA';
    if (s === 'pending' && p.settlementDisputed) return '#E8B923';
    return '#555';
  }

  loadStuck() {
    this.admin.listStuckPods().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.stuckPods = res.data;
        this.showStuckPanel = true;
      }
    });
  }

  selectPodAndSettle(p: AdminPod) {
    this.showStuckPanel = false;
    this.stuckPods = [];
    this.selectAndFetch(p);
  }

  toggleDisputedSelection(id: string) {
    if (this.selectedDisputedIds.has(id)) this.selectedDisputedIds.delete(id);
    else this.selectedDisputedIds.add(id);
  }

  startBatchResolve() {
    const podIds = Array.from(this.selectedDisputedIds);
    if (podIds.length === 0) return;
    this.batchResolveTarget = { podIds, result: '', note: '' };
  }

  confirmBatchResolve() {
    if (!this.batchResolveTarget || !this.batchResolveTarget.result || !this.batchResolveTarget.note.trim()) return;
    const t = this.batchResolveTarget;
    this.admin.batchResolveDisputes(t.podIds, t.result, t.note.trim()).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.batchResolveTarget = null;
        this.selectedDisputedIds.clear();
        this.loadDisputed();
        this.loadPods();
      },
      error: (err) => {
        console.error('Batch resolve failed:', err);
      }
    });
  }

  cancelBatchResolve() {
    this.batchResolveTarget = null;
  }

  get draftCount(): number { return this.pods.filter(p => p.status === 'draft').length; }

  get publishedCount(): number { return this.pods.filter(p => p.status === 'published').length; }

  get activeCount(): number { return this.pods.filter(p => p.status === 'active').length; }

  get settledCount(): number { return this.pods.filter(p => p.status === 'settled').length; }

  get cancelledCount(): number { return this.pods.filter(p => p.status === 'cancelled').length; }

  get activePodsCount(): number {
    return this.activeCount;
  }

  get pastPodsCount(): number {
    return this.settledCount + this.cancelledCount;
  }

  get disputedCount(): number {
    return this.pods.filter(p => p.settlementStatus === 'disputed').length;
  }

  get tabPods(): AdminPod[] {
    if (this.activeTab === 'active') {
      return this.pods.filter(p => ['draft', 'published', 'active'].includes(p.status));
    }
    if (this.activeTab === 'past') {
      return this.pods.filter(p => ['settled', 'cancelled'].includes(p.status));
    }
    return this.pods;
  }

  isMatchPassed(p: AdminPod): boolean {
    return new Date(p.matchDate) < new Date();
  }

  switchTab(tab: 'active' | 'past' | 'disputed') {
    this.activeTab = tab;
    this.statusFilter = '';
    this.page = 1;
    if (tab === 'disputed') {
      this.loadDisputed();
    }
    this.loadPods();
  }
}
