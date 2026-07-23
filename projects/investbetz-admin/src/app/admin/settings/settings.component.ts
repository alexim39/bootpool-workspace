import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSettingsStore } from './stores/admin-settings.store';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  readonly store = inject(AdminSettingsStore);

  ngOnInit() { this.store.load(); }
}
