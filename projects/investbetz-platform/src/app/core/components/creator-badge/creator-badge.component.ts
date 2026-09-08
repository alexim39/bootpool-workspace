import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TipsterBadge } from '../../services/social-feed.service';

/**
 * Settled-data creator badge. Renders nothing for Rookie/unqualified
 * creators — callers never need to guard. Tooltip carries the proof
 * (win rate over settled copies) so the chip is information, not decoration.
 */
@Component({
  selector: 'app-creator-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './creator-badge.component.html',
  styleUrls: ['./creator-badge.component.scss']
})
export class CreatorBadgeComponent {
  badge = input<TipsterBadge | null | undefined>(null);

  readonly show = () => {
    const tier = this.badge()?.tier;
    return !!tier && tier !== 'Rookie';
  };

  readonly tooltip = () => {
    const b = this.badge();
    if (!b || b.tier === 'Rookie') return '';
    const sample = `${b.settled} settled ${b.settled === 1 ? 'copy' : 'copies'}`;
    return `${b.tier} tipster — ${b.winRate}% win rate over ${sample}`;
  };
}
