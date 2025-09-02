import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BirdDetection } from '../../models/bird-detection.model';
import { BirdSpecies } from '../../models/bird-species';
import { SpaceToUnderscorePipe } from '../../pipes/space-to-underscore-pipe';


@Component({
  selector: 'app-detection-detail',
  imports: [PercentPipe, SpaceToUnderscorePipe],
  templateUrl: './detection-detail.html',
  styleUrl: './detection-detail.css'
})
export class DetectionDetail {
  @Input() detection!: BirdDetection;
  @Input() bird!: BirdSpecies;

  constructor(
    private router: Router
  ) {}

  goToBirdDetail() {
    this.router.navigate(['/species-detail', this.detection.Sci_Name]);
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
}
