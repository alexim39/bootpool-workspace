import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TodayGame } from '../../../../core/services';
import { GamesStore } from '../../stores/games.store';
import {
  hasScore,
  scoreText,
  matchStatusLabel,
  matchStatusClass,
  resultLabel,
  teamWon,
  pickOutcome,
  isLiveMatch,
  isFinishedMatch,
  isVoidMatch,
  isUpcomingMatch,
  livePeriodLabel,
  kickoffCountdown,
} from '../../game-status.util';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss']
})
export class GameCardComponent {
  game = input.required<TodayGame>();
  stakeRequested = output<TodayGame>();

  private readonly store = inject(GamesStore);

  confidenceLabel = (): string => `${this.game().confidence}%`;
  confidenceClass = (): string => {
    const c = this.game().confidence;
    if (c >= 70) return 'high';
    if (c >= 55) return 'mid';
    return 'low';
  };
  kickoff = (): string => {
    const d = new Date(this.game().matchDate);
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  readonly hasScore = computed(() => hasScore(this.game()));
  readonly scoreText = computed(() => scoreText(this.game()));
  readonly statusLabel = computed(() => matchStatusLabel(this.game().matchStatus));
  readonly statusClass = computed(() => matchStatusClass(this.game().matchStatus));
  readonly isLive = computed(() => isLiveMatch(this.game().matchStatus));
  readonly isFinished = computed(() => isFinishedMatch(this.game().matchStatus));
  readonly isVoid = computed(() => isVoidMatch(this.game().matchStatus));
  readonly isUpcoming = computed(() => isUpcomingMatch(this.game().matchStatus));
  readonly liveDetail = computed(() => livePeriodLabel(this.game().matchStatus));
  readonly countdown = computed(() => kickoffCountdown(this.game().matchDate, this.store.now()));
  readonly showKickoff = computed(() => isUpcomingMatch(this.game().matchStatus));
  readonly resultLabel = computed(() => resultLabel(this.game().result));
  readonly pickOutcome = computed(() => pickOutcome(this.game()));
  readonly teamWon = (side: 'home' | 'away') => teamWon(this.game(), side);

  onStake() {
    this.stakeRequested.emit(this.game());
  }
}
