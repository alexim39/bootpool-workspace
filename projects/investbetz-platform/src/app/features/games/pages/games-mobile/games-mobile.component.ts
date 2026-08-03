import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule,
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

  ngOnInit() {
    this.store.init();
  }

  selectLeague(league: string) {
    this.store.selectLeague(league);
  }

  onStake(game: TodayGame) {
    if (!game.podId) return;
    this.router.navigate(['/home'], { queryParams: { pod: game.podId } });
  }
}
