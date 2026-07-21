import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './core/services/auth.service';
import { RouteLoaderComponent } from './shared/services-module/loader/route-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSnackBarModule, MatDialogModule, RouteLoaderComponent],
  template: `
    <app-route-loader />
    <router-outlet />
  `
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.verifyToken().subscribe();
  }
}