import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminVirtualGamesStore } from './stores/admin-virtual-games.store';

@Component({
  selector: 'app-admin-virtual-games',
  standalone: true,
  imports: [DecimalPipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './virtual-games.component.html',
  styleUrls: ['./virtual-games.component.scss']
})
export class AdminVirtualGamesComponent implements OnInit {
  readonly store = inject(AdminVirtualGamesStore);

  get data() {
    return this.store.data();
  }

  ngOnInit() {
    this.store.load();
  }

  gameColor(game: string): string {
    const map: Record<string, string> = { coin_flip: '#E8B923', dice: '#00E676', color_wheel: '#2196f3' };
    return map[game] || '#555';
  }
}
