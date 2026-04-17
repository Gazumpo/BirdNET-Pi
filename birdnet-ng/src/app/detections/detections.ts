import { Component, OnDestroy, OnInit } from '@angular/core';
import { Data } from '../services/data';
import { BirdDetection } from '../models/bird-detection.model';
import { BirdSpecies } from '../models/bird-species';
import { Ws } from '../services/ws';
import { DetectionDetail } from '../bird-components/detection-detail/detection-detail';
import { DetectionNotifications } from '../services/detection-notifications';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Sunrise } from '../services/sunrise';


@Component({
  selector: 'app-home',
  imports: [DetectionDetail, ScrollingModule],
  templateUrl: './detections.html',
  styleUrl: './detections.css'
})
export class Detections {
  latestDetections!: BirdDetection[];  // all detections taken from db
  filteredLatestDetections!: BirdDetection[];  // filtered based on dropdown
  lastDetection!: BirdDetection | null;
  sunrise: any;

  birds: { [key: string]: BirdSpecies } = {};
  filter: string = 'birds';

  private destroy$ = new Subject<void>();
  private wsSubscription: Subscription | null = null;
  private reconnectAttemptCount = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds
  private readonly NUMBER_DETECTIONS_REQUEST = 150;

  constructor(
    private Data: Data,
    private Ws: Ws,
    private Sunrise: Sunrise,
    private detectionNotifications: DetectionNotifications
  ) {}
  
  ngOnInit(): void {
    this.initialiseData();
    this.connectWebSocket();

    // Add an event listener for visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('App is now visible. Checking WebSocket...');
        this.reconnectWebSocket();
      }
    });
  }

  private connectWebSocket(): void {
    if (this.wsSubscription && !this.wsSubscription.closed) {
      console.log('WebSocket subscription is already active.');
      return;
    }

    console.log('Connecting to WebSocket...');
    this.wsSubscription = this.detectionNotifications.latestDetection$.pipe(
      takeUntil(this.destroy$),
      switchMap(detection => {
        console.log('Detected New Bird: ', detection);
        this.lastDetection = detection;
        setTimeout(() => { this.lastDetection = null; }, 60000);
        return forkJoin({
          birdsData: this.Data.getBirds(),
          latestDetectionsData: this.Data.getLatest(this.NUMBER_DETECTIONS_REQUEST)
        });
      }),
      catchError(error => {
        console.error('WebSocket error:', error);
        this.handleWsError();
        return of(null);
      })
    ).subscribe(results => {
      if (results) {
        this.birds = results.birdsData.reduce((acc: { [key: string]: BirdSpecies }, bird: BirdSpecies) => {
          acc[bird.Sci_Name] = bird;
          return acc;
        }, {});
        this.latestDetections = results.latestDetectionsData;
        this.latestDetections = this.addTimeTypes(results.latestDetectionsData)
        this.filteredLatestDetections = this.filterDetections(results.latestDetectionsData);
        this.reconnectAttemptCount = 0; // Reset counter on successful message
      }
    }, error => {
      // This is for errors that terminate the observable
      console.error('WebSocket stream terminated with error:', error);
      this.handleWsError();
    });
  }

  private reconnectWebSocket(): void {
    if (this.Ws.ws && this.Ws.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already open.');
      this.reconnectAttemptCount = 0;
      return;
    }
    
    if (this.reconnectAttemptCount < this.MAX_RECONNECT_ATTEMPTS) {
      console.log(`Attempting to reconnect... Attempt #${this.reconnectAttemptCount + 1}`);
      this.reconnectAttemptCount++;
      setTimeout(() => {
        this.connectWebSocket();
      }, this.RECONNECT_DELAY * this.reconnectAttemptCount); // Exponential backoff-like delay
    } else {
      console.error('Max reconnection attempts reached. Giving up.');
    }
  }

  private handleWsError(): void {
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

  filterData(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log(selectedValue)
    this.filter = selectedValue
    
    this.filteredLatestDetections = this.filterDetections(this.latestDetections)
  }

  initialiseData() {
    console.log("loading all data")
    forkJoin({
      birdsData: this.Data.getBirds(),
      latestDetectionsData: this.Data.getLatest(this.NUMBER_DETECTIONS_REQUEST),
      sunrise: this.Sunrise.getSunrise(new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10))
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.birds = results.birdsData.reduce((acc: { [key: string]: BirdSpecies }, bird: BirdSpecies) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
      this.latestDetections = results.latestDetectionsData;
      this.sunrise = results.sunrise;

      this.latestDetections = this.addTimeTypes(results.latestDetectionsData)
      this.filteredLatestDetections = this.filterDetections(results.latestDetectionsData);
      console.log('Initial data loaded: birds', this.birds, 'latestBirds', this.latestDetections);
    });
  }

  addTimeTypes(detections: BirdDetection[]) {
    return detections.map(detection => {
      detection.timeType = this.Sunrise.returnTimeType(this.sunrise.results, detection.Time);
      detection.timeTypeIcon = "/sun/" + detection.timeType + ".png"
      return detection;
    });
  }

  filterDetections(detections: BirdDetection[]) {
    let filteredDetections;
    if (this.filter === '') {
      filteredDetections = detections
    } else if (this.filter === 'birds') {
      const seenBirds = new Set<string>();
      filteredDetections = detections.filter(detection => {
        if (!seenBirds.has(detection.Sci_Name)) {
          seenBirds.add(detection.Sci_Name);
          return true;
        }
        return false;
      });
    } else {
      filteredDetections = detections
    }

    return filteredDetections;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadBirds() {
    this.Data.getBirds().subscribe(birdsArray => {
      this.birds = birdsArray.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
    });
  }

}
