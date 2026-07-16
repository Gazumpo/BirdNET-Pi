import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationState } from './navigation-state';

describe('NavigationState', () => {
  let events: Subject<NavigationStart | NavigationEnd>;
  let service: NavigationState;
  let container: HTMLElement;
  let anchor: HTMLElement;

  beforeEach(() => {
    history.replaceState({ navigationId: 1 }, '');
    events = new Subject<NavigationStart | NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [
        NavigationState,
        { provide: Router, useValue: { events } }
      ]
    });

    service = TestBed.inject(NavigationState);
    container = document.createElement('main');
    anchor = document.createElement('article');
    anchor.dataset['scrollKey'] = 'species:Birdus example';
    container.appendChild(anchor);

    spyOn(container, 'getBoundingClientRect').and.returnValue({ top: 100 } as DOMRect);
    spyOn(anchor, 'getBoundingClientRect').and.callFake(() => ({
      top: 100 + 550 - container.scrollTop,
      bottom: 300 + 550 - container.scrollTop
    } as DOMRect));

    service.attachContainer(container);
  });

  it('restores the anchored card and page state on popstate navigation', fakeAsync(() => {
    container.scrollTop = 400;
    service.registerPageState('detections', () => ({ searchTerm: 'wren' }));

    events.next(new NavigationStart(2, '/species-detail/Birdus%20example', 'imperative', null));
    events.next(new NavigationEnd(2, '/species-detail/Birdus%20example', '/species-detail/Birdus%20example'));
    expect(container.scrollTop).toBe(0);

    service.unregisterPageState('detections');
    events.next(new NavigationStart(3, '/detections', 'popstate', { navigationId: 1 }));
    expect(service.restoredPageState<{ searchTerm: string }>('detections')).toEqual({ searchTerm: 'wren' });

    events.next(new NavigationEnd(3, '/detections', '/detections'));
    tick(20);

    expect(container.scrollTop).toBe(400);
  }));

  it('scrolls new forward navigations to the top', () => {
    container.scrollTop = 275;

    events.next(new NavigationStart(2, '/daily', 'imperative', null));
    events.next(new NavigationEnd(2, '/daily', '/daily'));

    expect(container.scrollTop).toBe(0);
  });
});
