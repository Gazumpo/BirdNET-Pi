import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BirdSpecies } from '../../models/bird-species';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { SpaceToUnderscorePipe } from '../../pipes/space-to-underscore-pipe';

@Component({
  selector: 'app-species-card',
  imports: [DecimalPipe, DatePipe, CommonModule, SpaceToUnderscorePipe, RouterLink],
  templateUrl: './species-card.html',
  styleUrl: './species-card.css'
})
export class SpeciesCard {
  @Input() bird!: BirdSpecies;
}
