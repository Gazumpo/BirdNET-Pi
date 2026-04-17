import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { DetectionOverlay } from './detection-overlay/detection-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Header, Sidebar, DetectionOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('birdnet-ng');
  private bo = inject(BreakpointObserver);

  readonly isHandset = toSignal(
    this.bo
      .observe([Breakpoints.XSmall, Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .pipe(map(r => r.matches)),
    { initialValue: false }
  );

  readonly isDesktopOrTablet = computed(() => !this.isHandset());
}
