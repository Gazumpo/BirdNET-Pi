import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface WikipediaResponse {
  query?: {
    pages?: {
      [key: string | number]: {
        pageid: number;
        ns: number;
        title: string;
        extract?: string; // The main description
        description?: string; // Short description
        fullurl?: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class Wikipedia {
  private readonly WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

  constructor(private http: HttpClient) { }

  getBirdDescription(birdName: string): Observable<string | null> {
    let birdNameFixed = birdName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');

    const params = {
      action: 'query',
      format: 'json',
      prop: 'extracts|description',
      exintro: '1',      // Get only the introduction
      explaintext: '1',  // Return plain text, not HTML
      redirects: '1',    // Follow redirects
      titles: birdNameFixed,
      origin: '*'        // Required for CORS when making cross-domain requests
    };

    return this.http.get<WikipediaResponse>(this.WIKIPEDIA_API_URL, { params }).pipe(
      map(response => {
        // Check if query and pages exist in the response
        console.log(response)
        if (response?.query?.pages) {
          const pageId = Object.keys(response.query.pages)[0];
          const page = response.query.pages[pageId];

          // Prefer full extract, otherwise short description
          if (page?.extract) {
            return page.extract;
          } else if (page?.description) {
            return page.description;
          }
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching bird description from Wikipedia:', error);
        return of(null);
      })
    );
  }

  getBirdUrl(birdName: string): Observable<string | null> {
    let birdNameFixed = birdName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');

    const params = {
      action: 'query',
      format: 'json',
      prop: 'info',
      explaintext: '1',  // Return plain text, not HTML
      redirects: '1',    // Follow redirects
      inprop: 'url',
      titles: birdNameFixed,
      origin: '*'        // Required for CORS when making cross-domain requests
    };

    return this.http.get<WikipediaResponse>(this.WIKIPEDIA_API_URL, { params }).pipe(
      map(response => {

        if (response?.query?.pages) {
          const pageId = Object.keys(response.query.pages)[0];
          const page = response.query.pages[pageId];

          // Prefer full extract, otherwise short description
          if (page?.fullurl) {
            return page.fullurl;
          } else {
            return null;
          }
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching bird description from Wikipedia:', error);
        return of(null);
      })
    );
  }
}