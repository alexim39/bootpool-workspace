import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MobileNavComponent } from '../../../../core/components';
import { AuthService } from '../../../../core/services';
import { GamesStore } from '../../stores/games.store';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { TodayGame } from '../../../../core/services';

@Component({
  selector: 'app-games-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MobileNavComponent,
    GameCardComponent,
    RouterLink,
  ],
  templateUrl: './games-mobile.component.html',
  styleUrls: ['./games-mobile.component.scss']
})
export class GamesMobileComponent implements OnInit {
  readonly store = inject(GamesStore);
  private router = inject(Router);
  readonly auth = inject(AuthService);
  readonly showGuide = signal(false);

  readonly sortOptions = [
    { value: 'matchDate', label: 'Kickoff' },
    { value: 'confidence', label: 'Confidence' },
    { value: 'gainsMultiplier', label: 'Odds' },
  ];

  readonly statusOptions = [
    { value: 'upcoming' as const, label: 'Today' },
    { value: 'live' as const, label: 'Live' },
    { value: 'finished' as const, label: 'Finished' },
    { value: 'all' as const, label: 'All' },
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

  onStake(game: TodayGame) {
    if (!game.stakable || !game.podId) return;
    this.router.navigate(['/home'], { queryParams: { pod: game.podId } });
  }
}
