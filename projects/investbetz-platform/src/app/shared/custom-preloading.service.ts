import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingService implements PreloadingStrategy {

  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload']) { // Check if preload key is set to true
      return fn(); // Return the observable fn if preloading is true
    } else {
      return of(null); // Return null if preloading is not set
    }
  }


  constructor() { }
}
