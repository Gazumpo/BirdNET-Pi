import { PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BirdDetection } from '../../models/bird-detection.model';
import { BirdSpecies } from '../../models/bird-species';
import { SpaceToUnderscorePipe } from '../../pipes/space-to-underscore-pipe';


@Component({
  selector: 'app-detection-detail',
  imports: [PercentPipe, SpaceToUnderscorePipe, RouterLink],
  templateUrl: './detection-detail.html',
  styleUrl: './detection-detail.css'
})
export class DetectionDetail {
  @Input() detection!: BirdDetection;
  @Input() bird!: BirdSpecies;
  @Input() isNew: boolean = false;
  @Input() timeType: string = '';

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
}
