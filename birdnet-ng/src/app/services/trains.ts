import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Trains {
  private apiUrl = 'api/API/TrainLiveTimes/LiveStatus/Fremantle%20Line/Claremont%20Stn';
  private headers: HttpHeaders

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders()
      .set('ModuleId', '5111')
      .set('TabId', '248');
  }

  getLatest(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.headers })
  }
}
