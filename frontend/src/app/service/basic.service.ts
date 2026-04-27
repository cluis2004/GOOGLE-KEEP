import { HttpClient, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of, throwError } from "rxjs";

@Injectable({providedIn: 'root'})
export class BasicService {
    private serviceHttp = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/api/v1';

    basePost(methodUrl: string, data: any): Observable<any> {
        return this.serviceHttp
            .post(`${this.baseUrl}/${methodUrl}`, data, { observe: 'response' })
            .pipe(
                map((response: HttpResponse<any>) => response.body),
                catchError((error: HttpErrorResponse) => {
                    // Angular can throw on body parse while status is still 2xx (e.g. 201).
                    if (error.status >= 200 && error.status < 300) {
                        const fallbackBody = (error.error as { text?: string })?.text ?? error.error ?? null;
                        return of(fallbackBody);
                    }

                    return throwError(() => error);
                })
            );
    }
}