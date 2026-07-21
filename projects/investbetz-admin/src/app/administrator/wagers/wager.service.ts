import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import {WagersInterface} from './wager.interface';

const httpOptions = {
    headers: new HttpHeaders({
    'Content-Type': 'application/json',
    })
};

@Injectable()
export class WagersService {

    private domain = environment.apiUrl.replace('/api', '');

    constructor(private http: HttpClient) {}

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occured. Handle accordingly
            // console.error('An error occured:', error.error.message);
            return throwError(`Request failed due to network error, please try again`);
        } else {
            // Backend returned an unsuccessful response code.
            // The repsonse body contains clues as to what went wrong
            // console.error(`Backend error code: ${error.status}, backend message: ${error.error}`);
            return throwError(error);
        }
        // Return an observable with user-facing error msg
        // return throwError(`Something went wrong, please try again.`)
    }

    public saveNightWager(postObj: WagersInterface): Observable<any> {
        const url = `${this.domain}/api/Clients/wagers/night`;

        return this.http.post<WagersInterface>(url, postObj, httpOptions)
        .pipe(
            retry(2), // retry a failed request up to 2 times
            catchError(this.handleError)
        );
    }

    public saveNoonWager(postObj: WagersInterface): Observable<any> {
        const url = `${this.domain}/api/Clients/wagers/noon`;

        return this.http.post<WagersInterface>(url, postObj, httpOptions)
        .pipe(
            retry(2), // retry a failed request up to 2 times
            catchError(this.handleError)
        );
    }

    public saveMorningWager(postObj: WagersInterface): Observable<any> {
        const url = `${this.domain}/api/Clients/wagers/morning`;

        return this.http.post<WagersInterface>(url, postObj, httpOptions)
        .pipe(
            retry(2), // retry a failed request up to 2 times
            catchError(this.handleError)
        );
    }
}