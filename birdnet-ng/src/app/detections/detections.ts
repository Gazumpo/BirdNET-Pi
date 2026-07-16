import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { Data } from '../services/data';
import { BirdDetection } from '../models/bird-detection.model';
import { BirdSpecies } from '../models/bird-species';
import { Ws } from '../services/ws';
import { DetectionDetail } from '../bird-components/detection-detail/detection-detail';
import { DetectionNotifications } from '../services/detection-notifications';
import { Sunrise } from '../services/sunrise';
import { stationToday } from '../utils/station-time';
import { NavigationState } from '../services/navigation-state';

interface DetectionsPageState {
  viewMode: string;
  rarityFilter: string;
  minConfidence: number;
  searchTerm: string;
  filtersExpanded: boolean;
}

interface BirdSummaryItem {
  Sci_Name: string;
  Com_Name: string;
  rarity?: string;
}

interface TodaySummary {
  detectionsToday: number;
  speciesToday: number;
  newSpeciesToday: BirdSummaryItem[];
  rareSpeciesToday: BirdSummaryItem[];
  highlightDetection: BirdDetection | null;
}

@Component({
  selector: 'app-home',
  imports: [DetectionDetail, FormsModule, RouterLink],
  templateUrl: './detections.html',
  styleUrl: './detections.css'
})
export class Detections implements OnInit, OnDestroy {
  latestDetections: BirdDetection[] = [];
  filteredLatestDetections: BirdDetection[] = [];
  sunrise: any;
  todaySummary: TodaySummary | null = null;

  birds: { [key: string]: BirdSpecies } = {};
  viewMode = 'birds';
  rarityFilter = 'all';
  minConfidence = 0;
  searchTerm = '';
  filtersExpanded = false;

  loading = true;
  errorMessage = '';
  wsConnected = false;

  private destroy$ = new Subject<void>();
  private wsSubscription: Subscription | null = null;
  private reconnectAttemptCount = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;
  private readonly numberDetectionsRequest = 150;
  private readonly pageStateKey = 'detections';
  private readonly visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      this.reconnectWebSocket();
    }
  };

  constructor(
    private data: Data,
    private ws: Ws,
    private sunriseService: Sunrise,
    private detectionNotifications: DetectionNotifications,
    private navigationState: NavigationState
  ) {}

  ngOnInit(): void {
    const restoredState = this.navigationState.restoredPageState<DetectionsPageState>(this.pageStateKey);
    if (restoredState) {
      this.viewMode = restoredState.viewMode;
      this.rarityFilter = restoredState.rarityFilter;
      this.minConfidence = restoredState.minConfidence;
      this.searchTerm = restoredState.searchTerm;
      this.filtersExpanded = restoredState.filtersExpanded;
    }
    this.navigationState.registerPageState(this.pageStateKey, () => this.currentPageState());
    this.initialiseData();
    this.ws.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.wsConnected = status;
      });
    this.connectWebSocket();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private connectWebSocket(): void {
    if (this.wsSubscription && !this.wsSubscription.closed) {
      return;
    }

    this.wsSubscription = this.detectionNotifications.latestDetection$.pipe(
      takeUntil(this.destroy$),
      switchMap(detection => {
        return forkJoin({
          latestDetectionsData: this.data.getLatest(this.numberDetectionsRequest),
          stats: this.data.getStatsDay(stationToday())
        });
      }),
      catchError(error => {
        this.handleWsError();
        return of({ latestDetectionsData: this.latestDetections, stats: null });
      })
    ).subscribe({
      next: results => {
        this.applyLatestDetections(results.latestDetectionsData);
        if (results.stats) {
          this.todaySummary = this.buildTodaySummary(results.stats);
        }
        this.reconnectAttemptCount = 0;
      },
      error: () => this.handleWsError()
    });
  }

  private reconnectWebSocket(): void {
    if (this.ws.ws && this.ws.ws.readyState === WebSocket.OPEN) {
      this.reconnectAttemptCount = 0;
      return;
    }

    if (this.reconnectAttemptCount < this.maxReconnectAttempts) {
      this.reconnectAttemptCount++;
      setTimeout(() => {
        this.ws.reconnect();
        this.connectWebSocket();
      }, this.reconnectDelay * this.reconnectAttemptCount);
    }
  }

  private handleWsError(): void {
    this.wsConnected = false;
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    this.reconnectWebSocket();
  }

  refreshData() {
    this.initialiseData();
    this.reconnectWebSocket();
  }

  initialiseData() {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      birdsData: this.data.getBirds(),
      latestDetectionsData: this.data.getLatest(this.numberDetectionsRequest),
      sunrise: this.sunriseService.getSunrise(stationToday()),
      stats: this.data.getStatsDay(stationToday())
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: results => {
        this.birds = results.birdsData.reduce((acc: { [key: string]: BirdSpecies }, bird: BirdSpecies) => {
          acc[bird.Sci_Name] = bird;
          return acc;
        }, {});
        this.sunrise = results.sunrise;
        this.applyLatestDetections(results.latestDetectionsData);
        this.todaySummary = this.buildTodaySummary(results.stats);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load detections right now.';
      }
    });
  }

  private applyLatestDetections(detections: BirdDetection[]) {
    this.latestDetections = this.addTimeTypes(detections);
    this.applyFilters();
  }

  private addTimeTypes(detections: BirdDetection[]) {
    if (!this.sunrise?.results) {
      return detections;
    }

    return detections.map(detection => {
      detection.timeType = this.sunriseService.returnTimeType(this.sunrise.results, detection.Time);
      detection.timeTypeIcon = '/sun/' + detection.timeType + '.png';
      return detection;
    });
  }

  private buildTodaySummary(stats: any): TodaySummary {
    const rareSpeciesToday = stats.speciesToday
      .map((sciName: string) => this.birds[sciName])
      .filter((bird: BirdSpecies | undefined) => bird && (bird.rarity === 'Rare' || bird.rarity === 'Very Rare'))
      .map((bird: BirdSpecies) => ({
        Sci_Name: bird.Sci_Name,
        Com_Name: bird.Com_Name,
        rarity: bird.rarity
      }));

    const newSpeciesToday = stats.newSpeciesToday.map((bird: any) => {
      const existingBird = this.birds[bird.Sci_Name];
      return {
        Sci_Name: bird.Sci_Name,
        Com_Name: bird.Com_Name,
        rarity: existingBird?.rarity
      };
    });

    const highlightDetection = this.latestDetections
      .filter(detection => detection.Date === stationToday())
      .sort((a, b) => b.Confidence - a.Confidence)[0] ?? null;

    return {
      detectionsToday: stats.numberDetectionsToday,
      speciesToday: stats.numberSpeciesToday,
      newSpeciesToday,
      rareSpeciesToday,
      highlightDetection
    };
  }

  applyFilters() {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();
    const seenBirds = new Set<string>();

    this.filteredLatestDetections = this.latestDetections.filter(detection => {
      const bird = this.birds[detection.Sci_Name];
      const rarity = bird?.rarity ?? '';
      const matchesSearch = normalizedTerm === ''
        || detection.Com_Name.toLowerCase().includes(normalizedTerm)
        || detection.Sci_Name.toLowerCase().includes(normalizedTerm);
      const matchesRarity = this.rarityFilter === 'all'
        || rarity.toLowerCase().replace(' ', '-') === this.rarityFilter;
      const matchesConfidence = detection.Confidence >= this.minConfidence;
      const matchesView = this.viewMode !== 'birds' || !seenBirds.has(detection.Sci_Name);

      if (this.viewMode === 'birds' && matchesSearch && matchesRarity && matchesConfidence && matchesView) {
        seenBirds.add(detection.Sci_Name);
      }

      return matchesSearch && matchesRarity && matchesConfidence && matchesView;
    });
  }

  hasActiveFilters() {
    return this.searchTerm.trim() !== ''
      || this.viewMode !== 'birds'
      || this.rarityFilter !== 'all'
      || this.minConfidence !== 0;
  }

  activeFilterCount() {
    return [
      this.searchTerm.trim() !== '',
      this.viewMode !== 'birds',
      this.rarityFilter !== 'all',
      this.minConfidence !== 0
    ].filter(Boolean).length;
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  clearFilters() {
    this.searchTerm = '';
    this.viewMode = 'birds';
    this.rarityFilter = 'all';
    this.minConfidence = 0;
    this.filtersExpanded = false;
    this.applyFilters();
  }

  trackDetection(index: number, detection: BirdDetection) {
    return detection.File_Name + detection.Time + index;
  }

  detectionScrollKey(detection: BirdDetection): string {
    return this.viewMode === 'birds'
      ? `species:${detection.Sci_Name}`
      : `detection:${detection.File_Name}:${detection.Time}`;
  }

  private currentPageState(): DetectionsPageState {
    return {
      viewMode: this.viewMode,
      rarityFilter: this.rarityFilter,
      minConfidence: this.minConfidence,
      searchTerm: this.searchTerm,
      filtersExpanded: this.filtersExpanded
    };
  }

  summaryBirds(items: BirdSummaryItem[], limit: number = 4) {
    return items.slice(0, limit);
  }

  ngOnDestroy(): void {
    this.navigationState.unregisterPageState(this.pageStateKey);
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }
}
