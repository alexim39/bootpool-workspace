import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventEmitterService {

  refreshDepositAccountBalance = new EventEmitter();
  refreshClientProfilePanel = new EventEmitter();
  subsVar!: Subscription;

  constructor() { }

  // Used to refresh deposit account balance
  refreshButtonClick() {
    this.refreshDepositAccountBalance.emit();
  }

  // Used to refresh client profile panel
  refreshClientProfileClick() {
    this.refreshClientProfilePanel.emit();
  }
}
