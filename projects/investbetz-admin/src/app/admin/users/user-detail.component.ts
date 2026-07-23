import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUsersStore } from './stores/admin-users.store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  readonly store = inject(AdminUsersStore);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.loadUser(id);
  }

  toggleStatus() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.toggleUserById(id);
  }

  verifyKyc() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.verifyUserKycById(id);
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }
}
