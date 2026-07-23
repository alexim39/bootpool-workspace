import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminOraChatStore } from './stores/admin-ora-chat.store';

@Component({
  selector: 'app-ora-chat',
  standalone: true,
  imports: [
    NgFor, NgIf, DatePipe, SlicePipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule
  ],
  templateUrl: './ora-chat.component.html',
  styleUrls: ['./ora-chat.component.scss']
})
export class OraChatComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminOraChatStore);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.store.loadStats();
    this.store.loadSessions();
  }

  ngOnDestroy() {
    this.store.destroy();
  }

  resolveSession() {
    this.store.resolveSession();
    this.snackBar.open('Conversation marked as resolved', 'Close', { duration: 3000, panelClass: ['snackbar', 'success'] });
  }

  onPageChange(e: PageEvent) {
    this.store.onPageChange(e);
  }

  getInitials(user: any): string {
    if (user?.fullName) return user.fullName.split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2);
    if (user?.phone) return user.phone.slice(-4);
    return '?';
  }
}
