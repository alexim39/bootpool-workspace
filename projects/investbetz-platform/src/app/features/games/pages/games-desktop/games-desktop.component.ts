import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AppNavComponent } from '../../../../core/components';
import { GamesStore } from '../../stores/games.store';
import { TodayGame } from '../../../../core/services';
import {
  isLiveMatch,
  isFinishedMatch,
  hasScore,
  scoreText,
  matchStatusLabel,
  matchStatusClass,
  resultLabel,
  teamWon,
  pickOutcome,
} from '../../game-status.util';

@Component({
  selector: 'app-games-desktop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    AppNavComponent,
  ],
  templateUrl: './games-desktop.component.html',
  styleUrls: ['./games-desktop.component.scss']
})
export class GamesDesktopComponent implements OnInit {
  readonly store = inject(GamesStore);
  private router = inject(Router);
  readonly Math = Math;
  readonly Number = Number;
  readonly isLiveMatch = isLiveMatch;
  readonly isFinishedMatch = isFinishedMatch;
  readonly hasScore = hasScore;
  readonly scoreText = scoreText;
  readonly matchStatusLabel = matchStatusLabel;
  readonly matchStatusClass = matchStatusClass;
  readonly resultLabel = resultLabel;
  readonly teamWon = teamWon;
  readonly pickOutcome = pickOutcome;

  readonly sortOptions = [
    { value: 'matchDate', label: 'Kickoff' },
    { value: 'confidence', label: 'Confidence' },
    { value: 'gainsMultiplier', label: 'Odds' },
    { value: 'league', label: 'League' },
    { value: 'homeTeam', label: 'Team' },
  ];

  ngOnInit() {
    this.store.init();
  }

  onSearch(event: Event) {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  onSortChange(value: string) {
    this.store.setSort(value);
  }

  kickoff(game: TodayGame): string {
    return new Date(game.matchDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  kickoffDay(game: TodayGame): string {
    const d = new Date(game.matchDate);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const day = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Today · ${day}`;
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${day}`;
    return day;
  }

  confidenceClass(conf: number): string {
    if (conf >= 70) return 'high';
    if (conf >= 55) return 'mid';
    return 'low';
  }

  onStake(game: TodayGame) {
    if (!game.stakable || !game.podId) return;
    this.router.navigate(['/home'], { queryParams: { pod: game.podId } });
  }
}
