import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminPod, SettlementCheckResult, CurationResponse, CurationFixture } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged, Subscription, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-betting',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1>{{ listStatus === 'all' ? 'All Pods' : listStatus === 'active' ? 'Pods Ready for Betting' : 'Settled Pods' }}</h1>
          <div class="stats-row">
            <span class="stat"><strong>{{ total }}</strong> pods</span>
            <span class="stat-divider"></span>
            <span class="stat booked-stat"><strong>{{ bookedCount }}</strong> booked</span>
            <span class="stat-divider"></span>
            <span class="stat">₦{{ totalExposure | number }} total exposure</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="btn-batch" *ngIf="selectedIds.size > 0"
            (click)="batchToggleBooked()"
            [disabled]="batchProcessing">
            <mat-icon>sync_alt</mat-icon>
            {{ selectedCount }} selected — {{ allSelectedBooked ? 'Mark Not Booked' : 'Mark Booked' }}
          </button>
          <button mat-stroked-button class="btn-settle-all" (click)="aiSettleAll()" [disabled]="settlingAll">
            <mat-icon>fact_check</mat-icon>
            <span *ngIf="!settlingAll">Settle All</span>
            <span *ngIf="settlingAll">Settling...</span>
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-select" style="min-width:120px;">
          <select [(ngModel)]="listStatus" (ngModelChange)="onFilterChange()" class="filter-dropdown">
            <option value="all">All</option>
            <option value="active">Ready</option>
            <option value="settled">Settled</option>
          </select>
        </div>
        <div class="filter-search">
          <mat-icon class="search-icon">search</mat-icon>
          <input type="text" class="search-input" placeholder="Search pods, teams, sports..."
            [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" />
          <button class="search-clear" *ngIf="searchTerm" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="filter-select">
          <select [(ngModel)]="sportFilter" (ngModelChange)="onFilterChange()" class="filter-dropdown">
            <option value="">All Sports</option>
            @for (s of sports; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
        <div class="filter-select">
          <select [(ngModel)]="bookedFilter" (ngModelChange)="onFilterChange()" class="filter-dropdown">
            <option value="">All Booking Status</option>
            <option value="not_booked">Not Booked</option>
            <option value="booked">Booked</option>
          </select>
        </div>
        <div class="filter-select" style="width:90px;">
          <select [(ngModel)]="limit" (ngModelChange)="onFilterChange()" class="filter-dropdown">
            <option [value]="20">20/page</option>
            <option [value]="50">50/page</option>
            <option [value]="100">100/page</option>
          </select>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="loading-bar" *ngIf="loading" style="height:3px;background:rgba(0,230,118,0.15);overflow:hidden;">
          <div class="loading-bar-fill"></div>
        </div>

        <table mat-table [dataSource]="pods" class="admin-table" multiTemplateDataRows>
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef class="col-select">
              <input type="checkbox" [checked]="allSelected" [indeterminate]="someSelected"
                (change)="toggleSelectAll($event)" class="row-checkbox" />
            </th>
            <td mat-cell *matCellDef="let p" class="col-select">
              <input type="checkbox" [checked]="selectedIds.has(p._id || p.id)"
                (change)="toggleSelect(p)" class="row-checkbox" />
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef class="col-sortable" (click)="toggleSort('title')">
              Pod
              <span class="sort-icon" *ngIf="sortBy === 'title'">{{ sortOrder === 'asc' ? '\\25B2' : '\\25BC' }}</span>
            </th>
            <td mat-cell *matCellDef="let p">
              <div class="pod-title">{{ p.title }}</div>
              <div class="pod-sport">{{ p.sport }}{{ p.league ? ' \u2014 ' + p.league : '' }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="selection">
            <th mat-header-cell *matHeaderCellDef>Selection</th>
            <td mat-cell *matCellDef="let p">
              <span class="selection-value">{{ p.selection }}</span>
              <span class="odds-value">{{ p.gainsMultiplier?.toFixed(2) }}x</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="scores">
            <th mat-header-cell *matHeaderCellDef>Scores</th>
            <td mat-cell *matCellDef="let p">
              <span class="scores-value" *ngIf="p.homeScore != null && p.awayScore != null; else noScores">
                {{ p.homeScore }} : {{ p.awayScore }}
              </span>
              <ng-template #noScores><span class="scores-na">—</span></ng-template>
            </td>
          </ng-container>

          <ng-container matColumnDef="outcome">
            <th mat-header-cell *matHeaderCellDef>Outcome</th>
            <td mat-cell *matCellDef="let p">
              <div class="outcome-cell">
                <span class="match-teams-sm">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
                <span class="result-chip" *ngIf="p.settlementStatus === 'settled' || p.status === 'settled'" [class.win]="p.result === 'win'" [class.loss]="p.result === 'loss'" [class.void]="p.result === 'void'">
                  {{ p.result?.toUpperCase() }}
                </span>
                <span class="match-status-text pending" *ngIf="p.settlementStatus !== 'settled' && p.status !== 'settled'">
                  {{ isPastGame(p) ? 'Awaiting Settlement' : getGameStatus(p) }}
                </span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="games">
            <th mat-header-cell *matHeaderCellDef>Games</th>
            <td mat-cell *matCellDef="let p">
              <div class="games-list">
                @if (p.legs && p.legs.length > 0) {
                  <div class="game-item">
                    <span class="game-teams">{{ p.legs[0].homeTeam }} vs {{ p.legs[0].awayTeam }}</span>
                    <span class="game-date">{{ p.legs[0].matchDate | date:'MMM d, HH:mm' }}</span>
                  </div>
                  <div class="game-more" *ngIf="p.legs.length > 1"
                    [matTooltip]="getLegsTooltip(p.legs)" matTooltipPosition="after">
                    +{{ p.legs.length - 1 }} more
                  </div>
                } @else {
                  <div class="game-item">
                    <span class="game-teams">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
                    <span class="game-date">{{ p.matchDate | date:'MMM d, HH:mm' }}</span>
                  </div>
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="stakes">
            <th mat-header-cell *matHeaderCellDef class="col-sortable" (click)="toggleSort('currentExposure')">
              Total Stakes
              <span class="sort-icon" *ngIf="sortBy === 'currentExposure'">{{ sortOrder === 'asc' ? '\\25B2' : '\\25BC' }}</span>
            </th>
            <td mat-cell *matCellDef="let p">
              <span class="stakes-value">\u20A6{{ p.currentExposure | number }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="participants">
            <th mat-header-cell *matHeaderCellDef class="col-sortable" (click)="toggleSort('currentParticipants')">
              Bettors
              <span class="sort-icon" *ngIf="sortBy === 'currentParticipants'">{{ sortOrder === 'asc' ? '\\25B2' : '\\25BC' }}</span>
            </th>
            <td mat-cell *matCellDef="let p">
              <span>{{ p.currentParticipants }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="gameStatus">
            <th mat-header-cell *matHeaderCellDef>Game</th>
            <td mat-cell *matCellDef="let p">
              <span class="game-status-chip" [class.live]="p.isLive" [class.about-to-start]="isAboutToStart(p)" [class.upcoming]="isUpcoming(p)" [class.finished]="isPastGame(p) && (p.settlementStatus === 'settled' || p.status === 'settled')" [class.awaiting]="isPastGame(p) && p.settlementStatus !== 'settled' && p.status !== 'settled'" [class.unknown-status]="true">
                {{ p.isLive ? 'LIVE' : isAboutToStart(p) ? 'Starting Soon' : isUpcoming(p) ? 'Upcoming' : isPastGame(p) && (p.settlementStatus === 'settled' || p.status === 'settled') ? 'Finished' : isPastGame(p) ? 'Awaiting Settlement' : '—' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="booked">
            <th mat-header-cell *matHeaderCellDef class="col-sortable" (click)="toggleSort('bookedExternally')">
              <span class="booked-header">
                <mat-icon>check_circle</mat-icon> Booked
                <span class="sort-icon" *ngIf="sortBy === 'bookedExternally'">{{ sortOrder === 'asc' ? '\\25B2' : '\\25BC' }}</span>
              </span>
            </th>
            <td mat-cell *matCellDef="let p">
              <label class="toggle-switch" [class.toggling]="togglingIds.has(p._id || p.id)"
                [matTooltip]="p.bookedExternally ? 'Click to mark as not booked' : 'Click to mark as booked with external bookies'"
                matTooltipPosition="left">
                <input type="checkbox" [checked]="!!p.bookedExternally"
                  [disabled]="togglingIds.has(p._id || p.id)"
                  (change)="toggleBooked(p)" />
                <span class="toggle-slider">
                  <span class="toggle-check"><mat-icon>check</mat-icon></span>
                </span>
              </label>
              <span class="booked-time" *ngIf="p.bookedExternally && p.bookedAt">
                {{ p.bookedAt | date:'MMM d, HH:mm' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="stakeRange">
            <th mat-header-cell *matHeaderCellDef>Stake Range</th>
            <td mat-cell *matCellDef="let p">
              <span>\u20A6{{ p.minStake | number }} \u2014 \u20A6{{ p.maxStake | number }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="stakeAction">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p" class="col-actions">
              <button mat-stroked-button class="btn-external" (click)="openExternalBetting(p)"
                matTooltip="View pod details & place bet" matTooltipPosition="left">
                <mat-icon>open_in_new</mat-icon> Place Bet
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"
            [class.row-booked]="row.bookedExternally"
            [class.row-selected]="selectedIds.has(row._id || row.id)"
            (click)="openExternalBetting(row)"></tr>
        </table>

        <div class="paginator" *ngIf="totalPages > 0">
          <div class="paginator-left">
            <span class="page-info">Showing {{ pods.length ? (page - 1) * limit + 1 : 0 }}–{{ Math.min(page * limit, total) }} of {{ total }}</span>
          </div>
          <div class="paginator-center">
            <button mat-icon-button class="page-btn" [disabled]="page <= 1" (click)="goTo(1)" matTooltip="First page">
              <mat-icon>first_page</mat-icon>
            </button>
            <button mat-icon-button class="page-btn" [disabled]="page <= 1" (click)="goTo(page - 1)" matTooltip="Previous">
              <mat-icon>chevron_left</mat-icon>
            </button>
            @for (p of visiblePages; track p) {
              <button class="page-num" [class.active]="p === page" (click)="goTo(p)">{{ p }}</button>
            }
            <button mat-icon-button class="page-btn" [disabled]="page >= totalPages" (click)="goTo(page + 1)" matTooltip="Next">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button mat-icon-button class="page-btn" [disabled]="page >= totalPages" (click)="goTo(totalPages)" matTooltip="Last page">
              <mat-icon>last_page</mat-icon>
            </button>
          </div>
          <div class="paginator-right">
            <span class="jump-label">Go to</span>
            <input type="number" class="jump-input" [(ngModel)]="jumpPage" (keydown.enter)="jumpToPage()"
              [min]="1" [max]="totalPages" />
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && pods.length === 0">
          <mat-icon class="empty-icon">sports_esports</mat-icon>
          <p class="empty-title">No pods ready for betting</p>
          <span class="empty-desc">All active pods are still accepting stakes or none match your filters</span>
        </div>
      </mat-card>

      <div class="detail-panel" *ngIf="detailPod">
        <div class="detail-header">
          <div class="detail-header-left">
            <h3>{{ detailPod.title }}</h3>
            <span class="chip" [style.background]="statusColor(detailPod.status)">{{ detailPod.status }}</span>
            <span class="chip" style="background:#2196f3" *ngIf="detailPod.settlementStatus">{{ detailPod.settlementStatus }}</span>
            <span class="detail-badge" [class.badge-booked]="detailPod.bookedExternally">
              {{ detailPod.bookedExternally ? 'Booked' : 'Not Booked' }}
            </span>
          </div>
          <button mat-icon-button (click)="detailPod = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><span class="d-label">Sport</span><span class="d-value">{{ detailPod.sport }}</span></div>
          <div class="detail-item"><span class="d-label">League</span><span class="d-value">{{ detailPod.league || '\u2014' }}</span></div>
          <div class="detail-item"><span class="d-label">Selection</span><span class="d-value" style="color:#00E676">{{ detailPod.selection }}</span></div>
          <div class="detail-item"><span class="d-label">Odds</span><span class="d-value" style="color:#E8B923">{{ detailPod.gainsMultiplier.toFixed(2) }}x</span></div>
          <div class="detail-item"><span class="d-label">Total Stakes</span><span class="d-value" style="color:#00E676">\u20A6{{ detailPod.currentExposure | number }}</span></div>
          <div class="detail-item"><span class="d-label">Bettors</span><span class="d-value">{{ detailPod.currentParticipants }}</span></div>
          <div class="detail-item"><span class="d-label">Stake Range</span><span class="d-value">\u20A6{{ detailPod.minStake | number }} \u2014 \u20A6{{ detailPod.maxStake | number }}</span></div>
          <div class="detail-item"><span class="d-label">Staking Closed</span><span class="d-value">{{ detailPod.stakingClosesAt | date:'MMM d, y HH:mm' }}</span></div>
          <div class="detail-item"><span class="d-label">Est. Settlement</span><span class="d-value">{{ detailPod.settlementEstimateLabel || (detailPod.settlementEstimateAt | date:'MMM d, y') }}</span></div>
          <div class="detail-item" *ngIf="detailPod.bookedAt">
            <span class="d-label">Booked At</span>
            <span class="d-value" style="color:#00E676">{{ detailPod.bookedAt | date:'MMM d, y HH:mm' }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>Games</h4>
          @if (detailPod.legs && detailPod.legs.length > 0) {
            @for (leg of detailPod.legs; track leg) {
              <div class="game-row">
                <span>{{ leg.homeTeam }} vs {{ leg.awayTeam }}</span>
                <span>{{ leg.matchDate | date:'MMM d, y HH:mm' }}</span>
                <span class="league-tag">{{ leg.league || detailPod.league }}</span>
              </div>
            }
          } @else {
            <div class="game-row">
              <span>{{ detailPod.homeTeam }} vs {{ detailPod.awayTeam }}</span>
              <span>{{ detailPod.matchDate | date:'MMM d, y HH:mm' }}</span>
            </div>
          }
        </div>
        <div class="detail-actions" *ngIf="canManage(detailPod)">
          <button mat-stroked-button class="action-settle" *ngIf="detailPod.status === 'active' || detailPod.status === 'published'" (click)="startSettle()">
            <mat-icon>check_circle</mat-icon> Settle
          </button>
          <button mat-stroked-button class="action-ai-settle" *ngIf="detailPod.status === 'active' || detailPod.status === 'published'" (click)="aiCheckSettle()" [disabled]="checkingSettle">
            <mat-icon>auto_awesome</mat-icon>
            {{ checkingSettle ? 'Checking...' : 'AI Settle' }}
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
      </div>

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
            <div class="settle-item-info">
              <span class="settle-item-teams">{{ r.homeTeam }} vs {{ r.awayTeam }}</span>
              <span class="settle-item-reason" *ngIf="r.recommendedResult === 'cannot_determine' || r.disputed">{{ r.reasoning }}</span>
              <span class="settle-item-scores" *ngIf="r.homeScore != null && r.awayScore != null">{{ r.homeScore }} : {{ r.awayScore }}</span>
            </div>
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
          <span>Needs Review — Stuck ({{ stuckPods.length }})</span>
          <button mat-icon-button (click)="showStuckPanel = false; stuckPods = []"><mat-icon>close</mat-icon></button>
        </div>
        <div class="stuck-body">
          <div class="stuck-empty" *ngIf="stuckPods.length === 0">All pods have linked fixtures.</div>
          <div class="stuck-item" *ngFor="let p of stuckPods">
            <div class="stuck-item-header">
              <span class="stuck-teams">{{ p.homeTeam }} vs {{ p.awayTeam }}</span>
              <span class="stuck-selection">{{ p.selection }} ({{ p.gainsMultiplier }}x)</span>
            </div>
            <div class="stuck-reason">{{ p.settlementStuckReason || 'No linked fixture — cannot auto-settle.' }} Settle manually using the pod detail panel.</div>
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
    </div>
  `,
  styles: [`
    .page { max-width: 1500px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .header-left h1 { color: #fff; font-size: 22px; font-weight: 600; margin: 0 0 6px; }
    .stats-row { display: flex; align-items: center; gap: 0; font-size: 12px; color: rgba(255,255,255,0.4); }
    .stat { white-space: nowrap; }
    .stat strong { color: rgba(255,255,255,0.7); font-weight: 600; }
    .stat-divider { width: 1px; height: 12px; background: rgba(255,255,255,0.1); margin: 0 12px; }
    .booked-stat strong { color: #00E676; }
    .header-actions { display: flex; gap: 8px; }
    .btn-batch { border-color: #00E676 !important; color: #00E676 !important; font-size: 12px !important; }
    .btn-batch mat-icon { font-size: 16px; margin-right: 4px; }

    .filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filter-search { position: relative; flex: 1; min-width: 200px; max-width: 360px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 18px; width: 18px; height: 18px; color: rgba(255,255,255,0.25); pointer-events: none; }
    .search-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 32px 8px 36px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.2s; }
    .search-input:focus { border-color: rgba(0,230,118,0.4); }
    .search-input::placeholder { color: rgba(255,255,255,0.25); }
    .search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; padding: 2px; }
    .search-clear mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .filter-select { min-width: 130px; }
    .filter-dropdown { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 10px; color: rgba(255,255,255,0.7); font-size: 12px; outline: none; cursor: pointer; appearance: auto; }
    .filter-dropdown:focus { border-color: rgba(0,230,118,0.4); }
    .filter-dropdown option { background: #0D1A30; color: #fff; }

    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; overflow: hidden; }
    .loading-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
    .loading-bar-fill { height: 100%; background: #00E676; width: 30%; border-radius: 2px; animation: loading-slide 1.2s ease infinite; }
    @keyframes loading-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }

    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.45) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.5px; border-bottom-color: rgba(255,255,255,0.08) !important; background: #0A1525 !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 12px !important; border-bottom-color: rgba(255,255,255,0.04) !important; background: transparent !important; }
    ::ng-deep .admin-table .mat-mdc-row:hover { background: rgba(255,255,255,0.02) !important; }
    .row-booked { opacity: 0.7; }
    .row-booked:hover { opacity: 0.85; }
    .row-selected { background: rgba(0,230,118,0.04) !important; }

    .col-select { width: 40px; text-align: center; }
    .col-select .row-checkbox { width: 15px; height: 15px; accent-color: #00E676; cursor: pointer; }
    .col-sortable { cursor: pointer; user-select: none; }
    .col-sortable:hover { color: rgba(255,255,255,0.7) !important; }
    .sort-icon { font-size: 8px; margin-left: 4px; }

    .pod-title { font-weight: 600; color: #fff; font-size: 13px; }
    .pod-sport { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px; }
    .selection-value { color: #00E676; font-weight: 500; display: block; }
    .odds-value { color: #E8B923; font-weight: 600; font-size: 11px; }
    .scores-value { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
    .scores-na { color: rgba(255,255,255,0.2); font-size: 13px; }
    .games-list { display: flex; flex-direction: column; gap: 2px; }
    .game-item { display: flex; flex-direction: column; line-height: 1.3; }
    .game-teams { font-size: 11px; color: rgba(255,255,255,0.65); }
    .game-date { font-size: 10px; color: rgba(255,255,255,0.35); }
    .game-more { font-size: 10px; color: #90CAF9; cursor: help; }

    .outcome-cell { display: flex; flex-direction: column; gap: 2px; min-width: 110px; }
    .match-teams-sm { font-size: 10px; color: rgba(255,255,255,0.35); }
    .score-display { display: flex; align-items: center; gap: 6px; margin-top: 1px; }
    .score-display.pending { opacity: 0.5; }
    .score-value { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
    .result-chip { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .result-chip.win { background: rgba(76,175,80,0.2); color: #4caf50; }
    .result-chip.loss { background: rgba(244,67,54,0.2); color: #f44336; }
    .result-chip.void { background: rgba(232,185,35,0.2); color: #E8B923; }
    .match-status-text { font-size: 11px; color: rgba(255,255,255,0.35); }
    .game-status-chip { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .game-status-chip.live { background: rgba(244,67,54,0.2); color: #f44336; animation: pulse-live 1.5s ease-in-out infinite; }
    .game-status-chip.about-to-start { background: rgba(232,185,35,0.2); color: #E8B923; }
    .game-status-chip.upcoming { background: rgba(33,150,243,0.15); color: #90CAF9; }
    .game-status-chip.finished { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
    .game-status-chip.awaiting { background: rgba(232,185,35,0.12); color: #E8B923; }
    .game-status-chip.unknown-status { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); }
    @keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .stakes-value { color: #00E676; font-weight: 700; }
    .col-actions { text-align: right; }
    .btn-external { border-color: rgba(144,202,249,0.4) !important; color: #90CAF9 !important; font-size: 11px !important; padding: 2px 8px !important; line-height: 28px !important; }
    .btn-external mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }

    .paginator { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); gap: 16px; flex-wrap: wrap; }
    .paginator-left { color: rgba(255,255,255,0.35); font-size: 11px; white-space: nowrap; }
    .paginator-center { display: flex; align-items: center; gap: 2px; }
    .page-btn { width: 32px; height: 32px; line-height: 32px; color: rgba(255,255,255,0.5) !important; }
    .page-btn mat-icon { font-size: 18px; width: 18px; height: 18px; line-height: 18px; }
    .page-num { min-width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .page-num:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .page-num.active { background: rgba(0,230,118,0.15); color: #00E676; font-weight: 600; }
    .paginator-right { display: flex; align-items: center; gap: 6px; }
    .jump-label { color: rgba(255,255,255,0.35); font-size: 11px; }
    .jump-input { width: 48px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 4px 6px; color: #fff; font-size: 12px; text-align: center; outline: none; }
    .jump-input:focus { border-color: rgba(0,230,118,0.4); }

    .empty-state { padding: 56px 24px; text-align: center; color: rgba(255,255,255,0.3); display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty-icon { font-size: 44px; width: 44px; height: 44px; opacity: 0.4; }
    .empty-title { color: rgba(255,255,255,0.5); font-size: 15px; font-weight: 500; margin: 0; }
    .empty-desc { font-size: 12px; }

    .detail-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 16px; padding: 20px; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .detail-header-left { display: flex; align-items: center; gap: 10px; }
    .detail-header-left h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .detail-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 2px 10px; border-radius: 10px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
    .detail-badge.badge-booked { background: rgba(0,230,118,0.12); color: #00E676; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .d-label { color: rgba(255,255,255,0.35); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .d-value { color: #fff; font-size: 13px; font-weight: 500; }
    .detail-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; }
    .detail-section h4 { color: rgba(255,255,255,0.45); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
    .game-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; color: rgba(255,255,255,0.65); border-bottom: 1px solid rgba(255,255,255,0.03); gap: 12px; }
    .league-tag { background: rgba(0,230,118,0.1); color: #00E676; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; white-space: nowrap; }

    .booked-header { display: inline-flex; align-items: center; gap: 4px; }
    .booked-header mat-icon { font-size: 14px; width: 14px; height: 14px; opacity: 0.5; }
    .toggle-switch { position: relative; display: inline-flex; align-items: center; cursor: pointer; width: 40px; height: 22px; flex-shrink: 0; vertical-align: middle; }
    .toggle-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 11px; transition: background 0.2s ease; }
    .toggle-slider .toggle-check { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #0D1A30; border-radius: 50%; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .toggle-slider .toggle-check mat-icon { font-size: 12px; width: 12px; height: 12px; opacity: 0; color: #fff; transition: opacity 0.15s ease; }
    .toggle-switch input:checked + .toggle-slider { background: #00E676; }
    .toggle-switch input:checked + .toggle-slider .toggle-check { transform: translateX(18px); background: #0D1A30; }
    .toggle-switch input:checked + .toggle-slider .toggle-check mat-icon { opacity: 1; }
    .toggle-switch.toggling { opacity: 0.4; pointer-events: none; }
    .booked-time { display: block; font-size: 9px; color: rgba(0,230,118,0.45); margin-top: 1px; white-space: nowrap; }

    .btn-settle-all { color: #81D4FA !important; border-color: #81D4FA !important; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; display: inline-block; }
    .detail-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
    .action-settle { color: #4caf50 !important; border-color: rgba(76,175,80,0.3) !important; }
    .action-ai-settle { color: #CE93D8 !important; border-color: rgba(206,147,216,0.3) !important; }
    .ai-settle-panel { margin-top: 12px; background: rgba(206,147,216,0.06); border: 1px solid rgba(206,147,216,0.15); border-radius: 8px; overflow: hidden; }
    .ai-settle-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(206,147,216,0.08); font-size: 13px; font-weight: 600; color: #CE93D8; }
    .ai-settle-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ai-settle-body { padding: 12px 14px; }
    .ai-settle-result { margin-bottom: 8px; }
    .score-row { font-size: 14px; color: #fff; font-weight: 500; margin-bottom: 4px; }
    .status-row { font-size: 11px; color: rgba(255,255,255,0.5); }
    .match-status { color: #00E676; font-weight: 600; }
    .no-data { color: rgba(255,255,255,0.4); font-style: italic; }
    .verdict-row { display: flex; align-items: center; gap: 8px; margin: 8px 0; flex-wrap: wrap; }
    .verdict-label { font-size: 12px; color: rgba(255,255,255,0.5); }
    .verdict-value { font-size: 16px; font-weight: 800; letter-spacing: 1px; }
    .verdict-value.win { color: #4caf50; }
    .verdict-value.loss { color: #f44336; }
    .verdict-value.void { color: #E8B923; }
    .verdict-value.unknown { color: rgba(255,255,255,0.3); }
    .verdict-confidence { font-size: 11px; color: rgba(255,255,255,0.35); }
    .reasoning-row { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5; margin-bottom: 8px; }
    .settle-form { margin-top: 12px; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
    .settle-form h4 { margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.7); }
    .settle-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-loss { background: #f44336 !important; color: #fff !important; }
    .btn-void { background: #E8B923 !important; color: #0A1428 !important; }
    .settle-all-panel { background: #0D1A30; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-top: 16px; overflow: hidden; }
    .settle-all-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255,255,255,0.03); font-size: 13px; font-weight: 600; color: #fff; }
    .settle-all-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .disputed-badge { background: rgba(232,185,35,0.15); color: #E8B923; padding: 1px 8px; border-radius: 8px; font-size: 11px; margin-left: 6px; }
    .stuck-badge { background: rgba(144,202,249,0.15); color: #90CAF9; padding: 1px 8px; border-radius: 8px; font-size: 11px; margin-left: 4px; }
    .settle-all-body { padding: 8px 16px 12px; }
    .settle-all-error { color: #f44336; font-size: 12px; padding: 4px 0; }
    .settle-all-item { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); gap: 8px; }
    .settle-item-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
    .settle-item-teams { color: rgba(255,255,255,0.7); }
    .settle-item-reason { font-size: 10px; color: rgba(255,255,255,0.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .settle-item-scores { font-size: 11px; color: #00E676; font-weight: 600; }
    .settle-item-verdict { font-weight: 700; font-size: 11px; }
    .settle-item-verdict.win { color: #4caf50; }
    .settle-item-verdict.loss { color: #f44336; }
    .settle-item-verdict.disputed { color: #E8B923; }
    .settle-item-verdict.stuck { color: #90CAF9; }
    .settle-item-verdict.unknown { color: rgba(255,255,255,0.3); }
    .settle-more { font-size: 11px; color: rgba(255,255,255,0.3); padding: 4px 0; }
    .settle-all-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .btn-dispute-review { border-color: rgba(232,185,35,0.4) !important; color: #E8B923 !important; font-size: 11px !important; }
    .btn-stuck-review { border-color: rgba(144,202,249,0.4) !important; color: #90CAF9 !important; font-size: 11px !important; }
    .disputed-panel, .stuck-panel { background: #0D1A30; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-top: 16px; overflow: hidden; }
    .disputed-header, .stuck-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255,255,255,0.03); font-size: 13px; font-weight: 600; color: #fff; }
    .disputed-header button, .stuck-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .disputed-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .btn-batch-resolve { border-color: rgba(0,230,118,0.4) !important; color: #00E676 !important; font-size: 11px !important; }
    .disputed-body, .stuck-body { padding: 8px 16px 12px; }
    .disputed-empty, .stuck-empty { color: rgba(255,255,255,0.3); font-size: 13px; padding: 16px 0; text-align: center; }
    .disputed-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .disputed-item-header { display: flex; align-items: center; gap: 8px; }
    .disputed-checkbox { margin-right: 4px; }
    .disputed-teams { font-weight: 600; color: #fff; font-size: 13px; }
    .disputed-selection { color: #00E676; font-size: 11px; font-weight: 500; margin-left: auto; }
    .disputed-reason { color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0 4px 32px; }
    .disputed-actions { margin-left: 32px; }
    .btn-resolve { border-color: rgba(0,230,118,0.3) !important; color: #00E676 !important; font-size: 11px !important; }
    .stuck-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .stuck-item-header { display: flex; align-items: center; gap: 8px; }
    .stuck-teams { font-weight: 600; color: #fff; font-size: 13px; }
    .stuck-selection { color: #90CAF9; font-size: 11px; margin-left: auto; }
    .stuck-reason { color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0; }
    .stuck-actions { margin-top: 4px; }
    .btn-settle-manual { border-color: rgba(144,202,249,0.4) !important; color: #90CAF9 !important; font-size: 11px !important; }
    .resolve-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .resolve-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
    .resolve-card { position: relative; background: #0D1A30; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; width: 100%; max-width: 480px; margin: 20px; }
    .resolve-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .resolve-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #fff; }
    .resolve-header button { color: rgba(255,255,255,0.4); }
    .resolve-body { padding: 16px 20px; }
    .resolve-pod-title { font-size: 15px; font-weight: 600; color: #fff; margin: 0 0 4px; }
    .resolve-dispute-reason { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0 0 16px; }
    .resolve-info { font-size: 13px; color: rgba(255,255,255,0.6); margin: 0 0 16px; }
    :host ::ng-deep .full-width { width: 100%; margin-bottom: 12px; }
    .resolve-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  `]
})
export class BettingComponent implements OnInit, OnDestroy {
  private admin = inject(AdminService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();
  Math = Math;

  pods: AdminPod[] = [];
  sports: string[] = [];
  loading = false;
  detailPod: AdminPod | null = null;
  togglingIds = new Set<string>();

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  searchTerm = '';
  sportFilter = '';
  bookedFilter = '';
  listStatus = 'all';
  sortBy = 'stakingClosesAt';
  sortOrder: 'desc' | 'asc' = 'desc';

  selectedIds = new Set<string>();
  batchProcessing = false;
  jumpPage: number | null = null;

  // Settlement state
  settlingAll = false;
  checkingSettle = false;
  settleCheck: SettlementCheckResult | null = null;
  settleTarget: AdminPod | null = null;
  settleAllResult: any = null;
  showDisputedPanel = false;
  disputedPods: AdminPod[] = [];
  selectedDisputedIds = new Set<string>();
  resolveTarget: { pod: AdminPod; result: string; note: string } | null = null;
  batchResolveTarget: { podIds: string[]; result: string; note: string } | null = null;
  showStuckPanel = false;
  stuckPods: AdminPod[] = [];

  private searchSubject = new Subject<string>();
  private searchSub: Subscription | null = null;

  columns = ['select', 'title', 'selection', 'scores', 'outcome', 'games', 'stakes', 'participants', 'gameStatus', 'booked', 'stakeRange', 'stakeAction'];

  get bookedCount(): number {
    return this.pods.filter(p => p.bookedExternally).length;
  }

  get totalExposure(): number {
    return this.pods.reduce((sum, p) => sum + (p.currentExposure || 0), 0);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get allSelected(): boolean {
    return this.pods.length > 0 && this.pods.every(p => this.selectedIds.has(p._id || p.id));
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  get allSelectedBooked(): boolean {
    return this.selectedIds.size > 0 && [...this.selectedIds].every(id => {
      const p = this.pods.find(x => (x._id || x.id) === id);
      return p?.bookedExternally;
    });
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.page;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  ngOnInit() {
    this.loadSports();
    this.loadPods();
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.loadPods());
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.page = 1;
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.page = 1;
    this.loadPods();
  }

  onFilterChange() {
    this.page = 1;
    this.loadPods();
  }

  toggleSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = field === 'stakingClosesAt' ? 'desc' : 'asc';
    }
    this.loadPods();
  }

  getGameStatus(pod: AdminPod): string {
    if (pod.settlementStatus === 'settled' || pod.status === 'settled') return 'Settled';
    if (pod.status === 'cancelled') return 'Cancelled';
    if (pod.isLive) return 'LIVE';
    if (this.isPastGame(pod)) return 'Awaiting Settlement';
    if (this.isAboutToStart(pod)) return 'Starting Soon';
    if (this.isUpcoming(pod)) return 'Upcoming';
    return '—';
  }

  isPastGame(pod: AdminPod): boolean {
    return !!pod.matchDate && new Date(pod.matchDate) < new Date();
  }

  isAboutToStart(pod: AdminPod): boolean {
    if (!pod.matchDate || pod.isLive) return false;
    const diff = new Date(pod.matchDate).getTime() - Date.now();
    return diff > 0 && diff <= 2 * 60 * 60 * 1000;
  }

  isUpcoming(pod: AdminPod): boolean {
    if (!pod.matchDate) return false;
    return new Date(pod.matchDate) > new Date() && !this.isAboutToStart(pod);
  }

  getLegsTooltip(legs: any[]): string {
    return legs.slice(1).map((l: any) => `${l.homeTeam} vs ${l.awayTeam} — ${new Date(l.matchDate).toLocaleString()}`).join('\n');
  }

  toggleSelect(pod: AdminPod) {
    const id = pod._id || pod.id;
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pods.forEach(p => this.selectedIds.add(p._id || p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  batchToggleBooked() {
    if (this.batchProcessing || this.selectedIds.size === 0) return;
    this.batchProcessing = true;
    const ids = [...this.selectedIds];
    const shouldBook = !this.allSelectedBooked;
    let completed = 0;
    ids.forEach(id => {
      this.togglingIds.add(id);
      this.admin.toggleExternalBooking(id).subscribe({
        next: (res) => {
          if (res.success) {
            const idx = this.pods.findIndex(p => (p._id || p.id) === id);
            if (idx !== -1) this.pods[idx] = { ...this.pods[idx], ...res.data };
          }
          this.togglingIds.delete(id);
          completed++;
          if (completed === ids.length) {
            this.batchProcessing = false;
            this.selectedIds.clear();
          }
        },
        error: () => {
          this.togglingIds.delete(id);
          completed++;
          if (completed === ids.length) {
            this.batchProcessing = false;
          }
        }
      });
    });
  }

  async loadPods() {
    this.loading = true;
    this.detailPod = null;
    const params = new URLSearchParams({
      page: String(this.page),
      limit: String(this.limit)
    });
    if (this.searchTerm) params.set('search', this.searchTerm);
    if (this.sportFilter) params.set('sport', this.sportFilter);
    if (this.bookedFilter) params.set('booked', this.bookedFilter);
    if (this.sortBy) params.set('sortBy', this.sortBy);
    if (this.sortOrder) params.set('sortOrder', this.sortOrder);
    if (this.listStatus) params.set('listStatus', this.listStatus);

    this.http.get<any>(`${environment.apiUrl}/admin/pods/ready-for-betting?${params}`).subscribe(res => {
      if (res.success) {
        this.pods = res.data.items.map((p: any) => ({ ...p, id: p._id || p.id }));
        this.total = res.data.total;
        this.page = res.data.page;
        this.totalPages = res.data.totalPages;
      }
      this.loading = false;
    });
  }

  loadSports() {
    this.http.get<{ success: boolean; data: string[] }>(`${environment.apiUrl}/pods/sports`).subscribe(res => {
      if (res.success) this.sports = res.data;
    });
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadPods();
  }

  jumpToPage() {
    if (this.jumpPage && this.jumpPage >= 1 && this.jumpPage <= this.totalPages) {
      this.goTo(this.jumpPage);
    }
    this.jumpPage = null;
  }

  toggleBooked(pod: AdminPod) {
    const id = pod._id || pod.id;
    if (this.togglingIds.has(id)) return;
    this.togglingIds.add(id);
    this.admin.toggleExternalBooking(id).subscribe({
      next: (res) => {
        if (res.success) {
          const idx = this.pods.findIndex(p => (p._id || p.id) === id);
          if (idx !== -1) this.pods[idx] = { ...this.pods[idx], ...res.data };
        }
        this.togglingIds.delete(id);
      },
      error: () => this.togglingIds.delete(id)
    });
  }

  openExternalBetting(pod: AdminPod) {
    this.detailPod = pod;
    this.settleCheck = null;
    this.settleTarget = null;
  }

  statusColor(status: string): string {
    const map: Record<string, string> = { draft: '#555', published: '#E8B923', active: '#00E676', settled: '#2196f3', cancelled: '#f44336' };
    return map[status] || '#555';
  }

  canManage(pod: AdminPod): boolean {
    return ['draft', 'published', 'active'].includes(pod.status);
  }

  // Settle All
  aiSettleAll() {
    this.settlingAll = true;
    this.settleAllResult = null;
    this.admin.aiSettleAll().pipe(takeUntil(this.destroy$), finalize(() => this.settlingAll = false)).subscribe({
      next: res => { if (res.success) { this.settleAllResult = res; this.loadPods(); } },
      error: () => this.settlingAll = false
    });
  }

  // AI Settle (check then confirm)
  aiCheckSettle() {
    if (!this.detailPod) return;
    this.checkingSettle = true;
    this.settleCheck = null;
    this.settleTarget = null;
    this.admin.aiSettleCheck(this.detailPod._id || this.detailPod.id).pipe(takeUntil(this.destroy$), finalize(() => this.checkingSettle = false)).subscribe({
      next: res => { if (res.success) this.settleCheck = res.data; },
      error: () => this.checkingSettle = false
    });
  }

  confirmAiSettle(result: string) {
    if (!this.detailPod || !this.settleCheck) return;
    this.admin.aiSettlePod(this.detailPod._id || this.detailPod.id, result, this.settleCheck.reasoning).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.detailPod = null;
          this.settleCheck = null;
          this.loadPods();
        }
      }
    });
  }

  // Manual Settle
  startSettle() {
    if (!this.detailPod) return;
    this.settleTarget = this.detailPod;
    this.settleCheck = null;
  }

  confirmSettle(result: string) {
    if (!this.settleTarget) return;
    const id = this.settleTarget._id || this.settleTarget.id;
    this.admin.settlePod(id, result, '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.detailPod = null;
          this.settleTarget = null;
          this.loadPods();
        } else {
          console.error('Settle failed:', res);
        }
      },
      error: (err) => console.error('Settle request error:', err)
    });
  }

  // Disputes
  loadDisputed() {
    this.showDisputedPanel = true;
    this.selectedDisputedIds.clear();
    this.admin.listDisputedSettlements().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { if (res.success) this.disputedPods = res.data; }
    });
  }

  toggleDisputedSelection(id: string) {
    if (this.selectedDisputedIds.has(id)) this.selectedDisputedIds.delete(id);
    else this.selectedDisputedIds.add(id);
  }

  startResolveDispute(pod: AdminPod) {
    this.resolveTarget = { pod, result: '', note: '' };
  }

  cancelResolveDispute() {
    this.resolveTarget = null;
  }

  confirmResolveDispute() {
    if (!this.resolveTarget || !this.resolveTarget.result || !this.resolveTarget.note.trim()) return;
    const podId = this.resolveTarget.pod._id || this.resolveTarget.pod.id;
    this.admin.resolveDispute(podId, this.resolveTarget.result, this.resolveTarget.note).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.disputedPods = this.disputedPods.filter(p => (p._id || p.id) !== podId);
          this.resolveTarget = null;
          this.loadPods();
        }
      }
    });
  }

  // Batch Resolve
  startBatchResolve() {
    this.batchResolveTarget = { podIds: [...this.selectedDisputedIds], result: '', note: '' };
  }

  cancelBatchResolve() {
    this.batchResolveTarget = null;
  }

  confirmBatchResolve() {
    if (!this.batchResolveTarget || !this.batchResolveTarget.result || !this.batchResolveTarget.note.trim()) return;
    this.admin.batchResolveDisputes(this.batchResolveTarget.podIds, this.batchResolveTarget.result, this.batchResolveTarget.note).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedDisputedIds.clear();
          this.batchResolveTarget = null;
          this.showDisputedPanel = false;
          this.disputedPods = [];
          this.loadPods();
        }
      }
    });
  }

  // Stuck pods
  loadStuck() {
    this.showStuckPanel = true;
    this.admin.listStuckPods().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { if (res.success) this.stuckPods = res.data; }
    });
  }

  selectPodAndSettle(pod: AdminPod) {
    this.showStuckPanel = false;
    this.stuckPods = [];
    this.detailPod = pod;
    this.settleCheck = null;
    this.settleTarget = null;
  }
}
