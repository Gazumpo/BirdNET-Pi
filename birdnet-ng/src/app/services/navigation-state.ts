import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface ScrollAnchor {
  key: string;
  offset: number;
}

interface PageState {
  key: string;
  value: unknown;
}

interface NavigationSnapshot {
  scrollTop: number;
  anchor: ScrollAnchor | null;
  pageState: PageState | null;
}

@Injectable({ providedIn: 'root' })
export class NavigationState implements OnDestroy {
  private readonly snapshots = new Map<number, NavigationSnapshot>();
  private readonly routerSubscription: Subscription;
  private container: HTMLElement | null = null;
  private activeNavigationId = Number(history.state?.navigationId ?? 0);
  private pendingRestoreId: number | null = null;
  private stateProvider: { key: string; read: () => unknown } | null = null;
  private restoreObserver: MutationObserver | null = null;
  private restoreTimeout: ReturnType<typeof setTimeout> | null = null;
  private restoreFrame: number | null = null;
  private readonly maxSnapshots = 100;

  constructor(private router: Router) {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.captureCurrentPage();
        this.pendingRestoreId = event.navigationTrigger === 'popstate'
          ? Number(event.restoredState?.navigationId ?? 0) || null
          : null;
      }

      if (event instanceof NavigationEnd) {
        this.activeNavigationId = event.id;
        if (this.pendingRestoreId === null) {
          this.cancelPendingRestore();
          this.scrollToTop();
        } else {
          this.beginRestore(this.snapshots.get(this.pendingRestoreId));
        }
      }
    });
  }

  attachContainer(container: HTMLElement): void {
    this.container = container;
  }

  registerPageState(key: string, read: () => unknown): void {
    this.stateProvider = { key, read };
  }

  unregisterPageState(key: string): void {
    if (this.stateProvider?.key === key) {
      this.stateProvider = null;
    }
  }

  restoredPageState<T>(key: string): T | null {
    if (this.pendingRestoreId === null) {
      return null;
    }

    const pageState = this.snapshots.get(this.pendingRestoreId)?.pageState;
    return pageState?.key === key ? pageState.value as T : null;
  }

  private captureCurrentPage(): void {
    if (!this.container || this.activeNavigationId <= 0) {
      return;
    }

    this.snapshots.set(this.activeNavigationId, {
      scrollTop: this.container.scrollTop,
      anchor: this.findVisibleAnchor(),
      pageState: this.stateProvider
        ? { key: this.stateProvider.key, value: this.stateProvider.read() }
        : null
    });
    this.pruneSnapshots();
  }

  private findVisibleAnchor(): ScrollAnchor | null {
    if (!this.container) {
      return null;
    }

    const containerTop = this.container.getBoundingClientRect().top;
    const anchors = this.container.querySelectorAll<HTMLElement>('[data-scroll-key]');
    for (const anchor of anchors) {
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom > containerTop) {
        const key = anchor.dataset['scrollKey'];
        return key ? { key, offset: rect.top - containerTop } : null;
      }
    }

    return null;
  }

  private beginRestore(snapshot: NavigationSnapshot | undefined): void {
    this.cancelPendingRestore();
    if (!this.container || !snapshot) {
      this.scrollToTop();
      this.pendingRestoreId = null;
      return;
    }

    const attemptRestore = (): boolean => {
      if (!this.container) {
        return false;
      }

      if (snapshot.anchor) {
        const anchor = Array.from(this.container.querySelectorAll<HTMLElement>('[data-scroll-key]'))
          .find(element => element.dataset['scrollKey'] === snapshot.anchor?.key);
        if (!anchor) {
          return false;
        }

        const containerTop = this.container.getBoundingClientRect().top;
        const target = this.container.scrollTop
          + anchor.getBoundingClientRect().top
          - containerTop
          - snapshot.anchor.offset;
        this.finishRestore(target);
        return true;
      }

      const maximumScroll = this.container.scrollHeight - this.container.clientHeight;
      if (maximumScroll < snapshot.scrollTop) {
        return false;
      }

      this.finishRestore(snapshot.scrollTop);
      return true;
    };

    if (attemptRestore()) {
      return;
    }

    this.restoreObserver = new MutationObserver(() => attemptRestore());
    this.restoreObserver.observe(this.container, { childList: true, subtree: true });
    this.restoreTimeout = setTimeout(() => this.finishRestore(snapshot.scrollTop), 10000);
  }

  private finishRestore(scrollTop: number): void {
    this.restoreObserver?.disconnect();
    this.restoreObserver = null;
    if (this.restoreTimeout !== null) {
      clearTimeout(this.restoreTimeout);
      this.restoreTimeout = null;
    }

    if (!this.container) {
      return;
    }

    if (this.restoreFrame !== null) {
      cancelAnimationFrame(this.restoreFrame);
    }
    this.restoreFrame = requestAnimationFrame(() => {
      if (this.container) {
        this.container.scrollTop = scrollTop;
      }
      this.restoreFrame = null;
      this.pendingRestoreId = null;
    });
  }

  private scrollToTop(): void {
    if (this.container) {
      this.container.scrollTop = 0;
    }
  }

  private cancelPendingRestore(): void {
    this.restoreObserver?.disconnect();
    this.restoreObserver = null;
    if (this.restoreTimeout !== null) {
      clearTimeout(this.restoreTimeout);
      this.restoreTimeout = null;
    }
    if (this.restoreFrame !== null) {
      cancelAnimationFrame(this.restoreFrame);
      this.restoreFrame = null;
    }
  }

  private pruneSnapshots(): void {
    while (this.snapshots.size > this.maxSnapshots) {
      const oldestId = this.snapshots.keys().next().value;
      if (oldestId === undefined) {
        return;
      }
      this.snapshots.delete(oldestId);
    }
  }

  ngOnDestroy(): void {
    this.cancelPendingRestore();
    this.routerSubscription.unsubscribe();
  }
}
