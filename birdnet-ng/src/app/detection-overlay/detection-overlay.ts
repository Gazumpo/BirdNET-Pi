import { CommonModule, PercentPipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BirdDetection } from '../models/bird-detection.model';
import { BirdSpecies } from '../models/bird-species';
import { Data } from '../services/data';
import { DetectionNotifications } from '../services/detection-notifications';
import { SpaceToUnderscorePipe } from '../pipes/space-to-underscore-pipe';

@Component({
  selector: 'app-detection-overlay',
  standalone: true,
  imports: [CommonModule, PercentPipe, SpaceToUnderscorePipe],
  templateUrl: './detection-overlay.html',
  styleUrl: './detection-overlay.css'
})
export class DetectionOverlay implements OnDestroy {
  currentDetection: BirdDetection | null = null;
  currentBird: BirdSpecies | null = null;

  private birds: { [key: string]: BirdSpecies } = {};
  private subs = new Subscription();
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private detectionNotifications: DetectionNotifications,
    private data: Data,
    private router: Router
  ) {
    this.loadBirds();
    this.subs.add(
      this.detectionNotifications.latestDetection$.subscribe(detection => {
        this.currentDetection = detection;
        this.currentBird = this.birds[detection.Sci_Name] ?? null;
        this.startHideTimer();
      })
    );
  }

  private loadBirds(): void {
    this.subs.add(
      this.data.getBirds().subscribe(birds => {
        this.birds = birds.reduce((acc: { [key: string]: BirdSpecies }, bird: BirdSpecies) => {
          acc[bird.Sci_Name] = bird;
          return acc;
        }, {});

        if (this.currentDetection) {
          this.currentBird = this.birds[this.currentDetection.Sci_Name] ?? null;
        }
      })
    );
  }

  private startHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => this.clearDetection(), 60000);
  }

  clearDetection(): void {
    this.currentDetection = null;
    this.currentBird = null;
    this.hideTimer = null;
  }

  ngOnDestroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.subs.unsubscribe();
  }

  goToBirdDetail(): void {
    if (!this.currentDetection) {
      return;
    }
    this.router.navigate(['/species-detail', this.currentDetection.Sci_Name]);
    this.clearDetection();
  }

  goToDetections(): void {
    this.router.navigate(['/detections']);
    this.clearDetection();
  }
}
