import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeviceService, LeaderboardService, LeaderboardPeriod, LeaderboardPage } from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, AppNavComponent, MobileNavComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  device = inject(DeviceService);
  isMobileView = computed(() => this.device.isMobile() || this.device.isTablet());
  private service = inject(LeaderboardService);
  private snackBar = inject(MatSnackBar);

  period = signal<LeaderboardPeriod>('month');
  page = signal(1);
  limit = 25;
  periods: LeaderboardPeriod[] = ['week', 'month', 'all'];
  totalPages = computed(() => {
    const b = this.board();
    return b ? Math.max(1, Math.ceil(b.total / b.limit)) : 1;
  });

  board = this.service.board;
  myRank = this.service.myRank;
  loading = this.service.loading;
  error = this.service.error;

  lastWin = signal<{ podTitle: string; netPayout: number; multiplier: number; settledAt: string } | null>(null);
  shareCopied = signal(false);

  skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit() {
    this.setPeriod('month');
  }

  setPeriod(p: LeaderboardPeriod) {
    this.period.set(p);
    this.page.set(1);
    this.load();
  }

  load() {
    const p = this.period();
    this.service.fetchLeaderboard(p, this.page(), this.limit);
    this.service.fetchMyRank(p);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.service.fetchLeaderboard(this.period(), p, this.limit);
  }

  loadLastWin() {
    this.service.fetchLastWin().subscribe({
      next: (res) => {
        if (res.success) this.lastWin.set(res.data);
      },
      error: () => {}
    });
  }

  rankBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  rankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  formatMoney(n: number): string {
    return '₦' + n.toLocaleString('en-US');
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
  }

  shareWin() {
    const w = this.lastWin();
    if (!w) return;
    const text = `I just won ₦${w.netPayout.toLocaleString()} on ${w.podTitle} @ ${w.multiplier}x on BetPool! 🎉`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.shareCopied.set(true);
        this.snackBar.open('Win summary copied — paste it anywhere', 'OK', { duration: 2500 });
        setTimeout(() => this.shareCopied.set(false), 2500);
      }).catch(() => this.snackBar.open('Could not copy — share manually', 'OK', { duration: 2500 }));
    } else {
      this.snackBar.open(text, 'OK', { duration: 6000 });
    }
  }

  shareWinWhatsApp() {
    const w = this.lastWin();
    if (!w) return;
    const text = encodeURIComponent(`I just won ₦${w.netPayout.toLocaleString()} on ${w.podTitle} @ ${w.multiplier}x on BetPool! 🎉`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}
