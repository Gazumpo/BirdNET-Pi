import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BirdSpecies } from '../../models/bird-species';
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { SpaceToUnderscorePipe } from '../../pipes/space-to-underscore-pipe';

@Component({
  selector: 'app-species-card',
  imports: [DecimalPipe, CommonModule, SpaceToUnderscorePipe],
  templateUrl: './species-card.html',
  styleUrl: './species-card.css'
})
export class SpeciesCard {
  @Input() bird!: BirdSpecies;
  constructor(private router: Router) {}

  goToBirdDetail() {
    this.router.navigate(['/species-detail', this.bird.Sci_Name]);
  }
}
