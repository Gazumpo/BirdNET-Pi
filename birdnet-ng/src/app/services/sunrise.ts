import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Sunrise {
  //private apiUrl = '/json';
  private apiUrl = 'https://api.sunrise-sunset.org/json'

  constructor(private http: HttpClient) {

  }

  getSunrise(date: string): Observable<any> {
    console.log('sunrise api', this.apiUrl)
    let params = new HttpParams()
      .set('lat', '-31.9832')
      .set('lng', '115.7762')
      .set('tzid', 'Australia/Perth')
      .set('date', date);
    return this.http.get(this.apiUrl, { params })
  }
}
