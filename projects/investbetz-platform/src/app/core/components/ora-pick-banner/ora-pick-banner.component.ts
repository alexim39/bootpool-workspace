import { Component, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OraPickService, OraPick } from '../../services';

@Component({
  selector: 'app-ora-pick-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './ora-pick-banner.component.html',
  styleUrls: ['./ora-pick-banner.component.scss']
})
export class OraPickBannerComponent implements OnInit {
  private service = inject(OraPickService);
  @Output() stake = new EventEmitter<OraPick>();

  pick = this.service.pick;
  loading = this.service.loading;
  error = this.service.error;
  showReason = signal(false);

  ngOnInit() {
    this.service.fetchPick();
  }

  stakeNow() {
    const p = this.pick();
    if (p) this.stake.emit(p);
  }

  kickoffLabel(p: OraPick): string {
    return new Date(p.kickoff).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
}
