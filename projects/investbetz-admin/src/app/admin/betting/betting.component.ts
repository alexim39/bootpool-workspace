import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPod } from '../services';
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
import { AdminBettingStore } from './stores/admin-betting.store';

@Component({
  selector: 'app-betting',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './betting.component.html',
  styleUrls: ['./betting.component.scss']
})
export class BettingComponent implements OnInit {
  readonly store = inject(AdminBettingStore);
  Math = Math;
  columns = ['select', 'title', 'selection', 'scores', 'outcome', 'games', 'stakes', 'participants', 'gameStatus', 'booked', 'stakeRange', 'stakeAction'];

  ngOnInit() {
    this.store.loadSports();
    this.store.loadPods();
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

  statusColor(status: string): string {
    const map: Record<string, string> = { draft: '#555', published: '#E8B923', active: '#00E676', settled: '#2196f3', cancelled: '#f44336' };
    return map[status] || '#555';
  }

  canManage(pod: AdminPod): boolean {
    return ['draft', 'published', 'active'].includes(pod.status);
  }
}
