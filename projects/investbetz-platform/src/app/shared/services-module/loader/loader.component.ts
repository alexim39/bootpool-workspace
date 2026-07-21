import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { LoaderService } from './loader.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    imports: [NgIf, MatProgressSpinner, AsyncPipe]
})
export class LoaderComponent implements OnInit {

  isLoading: Subject<boolean>;

  constructor(private loaderService: LoaderService){}

  ngOnInit(): void {
    this.isLoading = this.loaderService.isLoading;;
  }

}
