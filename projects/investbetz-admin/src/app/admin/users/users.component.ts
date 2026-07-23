import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { AdminUser } from '../services';
import { Router } from '@angular/router';
import { AdminUsersStore } from './stores/admin-users.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgIf, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatPaginatorModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  readonly store = inject(AdminUsersStore);
  private router = inject(Router);

  viewUser(u: AdminUser) {
    this.router.navigate(['/admin/users', u.id]);
  }
}
