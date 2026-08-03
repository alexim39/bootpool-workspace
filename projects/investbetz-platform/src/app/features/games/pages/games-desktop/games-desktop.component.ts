import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppNavComponent } from '../../../../core/components';
import { GamesStore } from '../../stores/games.store';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { TodayGame } from '../../../../core/services';

@Component({
  selector: 'app-games-desktop',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AppNavComponent,
    GameCardComponent,
  ],
  templateUrl: './games-desktop.component.html',
  styleUrls: ['./games-desktop.component.scss']
})
export class GamesDesktopComponent implements OnInit {
  readonly store = inject(GamesStore);
  private router = inject(Router);

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
