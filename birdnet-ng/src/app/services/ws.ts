import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Ws {
  public messages$ = new Subject<any>();

  constructor() {
    const ws = new WebSocket('ws://birdnet.local:3000');
    ws.onmessage = (event) => {
      let data = JSON.parse(event.data)
      this.messages$.next(data);
    };
  }
}