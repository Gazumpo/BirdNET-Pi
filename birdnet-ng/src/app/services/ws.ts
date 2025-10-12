import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Ws {
  public messages$ = new Subject<any>();
  ws: WebSocket;


  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.protocol === 'https:' ? 'window.location.host' : 'birdnet.local';
    const path = '/ws-path';

    this.ws = new WebSocket(`${protocol}//${host}:3000/${path}`);
    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data)
      this.messages$.next(data);
    };
  }
}