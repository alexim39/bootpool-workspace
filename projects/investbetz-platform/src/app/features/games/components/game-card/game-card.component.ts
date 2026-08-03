import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TodayGame } from '../../../../core/services';
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
  readonly showKickoff = computed(() => !isLiveMatch(this.game().matchStatus) && !isFinishedMatch(this.game().matchStatus) && !isVoidMatch(this.game().matchStatus));
  readonly resultLabel = computed(() => resultLabel(this.game().result));
  readonly pickOutcome = computed(() => pickOutcome(this.game()));
  readonly teamWon = (side: 'home' | 'away') => teamWon(this.game(), side);

  onStake() {
    this.stakeRequested.emit(this.game());
  }
}
