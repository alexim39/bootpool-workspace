import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
  'Content-Type': 'application/json'
  })
};


@Injectable({
  providedIn: 'root',
})
export class UsersService {

  private domain = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
        // A client-side or network error occured. Handle accordingly
        // console.error('An error occured:', error.error.message);
        return throwError(`Request failed due to network error, please try again`);
    } else {
        // Backend returned an unsuccessful response code.
        // The repsonse body contains clues as to what went wrong
        //console.error(`Backend error code: ${error.status}, backend message: ${error.error}`);
        return throwError(error);
    }
    // Return an observable with user-facing error msg
    // return throwError(`Something went wrong, please try again.`)
  }


  public getUsers(): Observable<any> {
    const copybetterstUrl = `${this.domain}/api/Clients`;
    return this.http.get<any>(copybetterstUrl, httpOptions)
    .pipe(
        retry(2), // retry a failed request up to 2 times
        catchError(this.handleError)
    );
  } 

}