import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BirdDetection } from '../models/bird-detection.model';
import { Ws } from './ws';

@Injectable({
  providedIn: 'root'
})
export class DetectionNotifications {
  private readonly detection$: Observable<BirdDetection>;

  constructor(private ws: Ws) {
    // Map websocket payloads into BirdDetection instances and expose the stream.
    this.detection$ = this.ws.messages$.pipe(
      map(msg => new BirdDetection(msg)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Emits whenever a new bird detection is pushed over the websocket.
   */
  get latestDetection$(): Observable<BirdDetection> {
    return this.detection$;
  }
}
