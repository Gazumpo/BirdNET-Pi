import { AfterViewInit, Component, ElementRef, ViewChild, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { NavigationState } from './services/navigation-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Header, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  @ViewChild('mainContent') private mainContent!: ElementRef<HTMLElement>;
  protected readonly title = signal('birdnet-ng');
  private bo = inject(BreakpointObserver);
  private navigationState = inject(NavigationState);

  readonly isHandset = toSignal(
    this.bo
      .observe([Breakpoints.XSmall, Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .pipe(map(r => r.matches)),
    { initialValue: false }
  );

  readonly isDesktopOrTablet = computed(() => !this.isHandset());

  ngAfterViewInit(): void {
    this.navigationState.attachContainer(this.mainContent.nativeElement);
  }
}
