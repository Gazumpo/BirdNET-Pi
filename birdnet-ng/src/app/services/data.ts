import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { BirdDetection } from '../models/bird-detection.model';
import { BirdSpecies } from '../models/bird-species';

@Injectable({
  providedIn: 'root'
})
export class Data {
  private apiUrl = 'http://birdnet.local:3000';
  private birdCache = new Map<string, BirdSpecies>();


  constructor(private http: HttpClient) {}

  getLatest(limit: number = 20, Sci_Name: string = ''): Observable<BirdDetection[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (Sci_Name) {
      params = params.set('bird', Sci_Name);
    }
    return this.http.get<any[]>(`${this.apiUrl}/latest`, {params: params}).pipe(
      map(data => data.map(item => new BirdDetection(item)))
    );
  }

  getToday(): Observable<BirdDetection[]> {
    return this.http.get<any[]>(`${this.apiUrl}/day`).pipe(
      map(data => data.map(item => new BirdDetection(item)))
    );
  }

  getDay(date: string): Observable<BirdDetection[]> {
    let params = new HttpParams().set('date', date);
    return this.http.get<any[]>(`${this.apiUrl}/day`, {params: params}).pipe(
      map(data => data.map(item => new BirdDetection(item)))
    );
  }

  getBest(Sci_Name: string): Observable<BirdDetection> {
    let params = new HttpParams().set('bird', Sci_Name);
    return this.http.get<any>(`${this.apiUrl}/best`, {params: params}).pipe(
      map(data => new BirdDetection(data))
    );
  }

  getBirds(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/birds`).pipe(
      map(data => data.map(item => new BirdSpecies(item)))
    );
  }

  getBird(Sci_Name: string): Observable<BirdSpecies> {
    if (this.birdCache.has(Sci_Name)) {
      console.log(`Returning bird details for '${Sci_Name}' from cache.`);
      return of(this.birdCache.get(Sci_Name)!); // Use '!' because we know it exists due to .has()
    }

    let params = new HttpParams().set('bird', Sci_Name);
    return this.http.get<any>(`${this.apiUrl}/bird`, {params: params}).pipe(
      map(data => new BirdSpecies(data)),
      tap(bird => {
        this.birdCache.set(Sci_Name, bird);
      })
    );
  }

  getStatsAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats-all`);
  }

  getStatsDay(date: string): Observable<any[]> {
    let params = new HttpParams().set('date', date);
    return this.http.get<any[]>(`${this.apiUrl}/stats-day`, {params: params});
  }

  getStatsRange(date1: string, date2: string): Observable<any[]> {
    let params = new HttpParams()
      .set('date1', date1)
      .set('date2', date2);
    return this.http.get<any[]>(`${this.apiUrl}/stats-range`, {params: params});
  }
}
