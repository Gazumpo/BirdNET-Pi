import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Ws {
  public messages$ = new Subject<any>();
  public connectionStatus$ = new BehaviorSubject<boolean>(false);
  ws!: WebSocket;

  constructor() {
    this.connect();
  }

  reconnect() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
      return;
    }

    if (this.ws.readyState === WebSocket.CLOSING) {
      this.connectionStatus$.next(false);
    }
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const path = '/ws-path';

    this.ws = new WebSocket(`${protocol}//${host}${path}`);

    this.ws.onopen = () => {
      this.connectionStatus$.next(true);
    };

    this.ws.onclose = () => {
      this.connectionStatus$.next(false);
    };

    this.ws.onerror = () => {
      this.connectionStatus$.next(false);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messages$.next(data);
    };
  }
}
