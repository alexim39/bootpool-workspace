import { Component, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { HomeStore } from '../../stores/home.store';
import { Pod } from '../../../../core/services';

@Component({
  selector: 'app-stories-rail',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './stories-rail.component.html',
  styleUrls: ['./stories-rail.component.scss']
})
export class StoriesRailComponent {
  readonly store = inject(HomeStore);
  @Output() openPick = new EventEmitter<Pod>();

  readonly topPick = computed(() => this.store.activePods()[0] ?? null);
  readonly livePick = computed(() => this.store.livePods()[0] ?? null);

  openTopPick() {
    const pod = this.topPick();
    if (pod) this.openPick.emit(pod);
  }

  openLivePick() {
    const pod = this.livePick();
    if (pod) this.openPick.emit(pod);
  }
}