import { Component } from '@angular/core';
import { SpeciesCard } from './species-card/species-card';
import { BirdSpecies } from '../models/bird-species';
import { Data } from '../services/data';

@Component({
  selector: 'app-species',
  templateUrl: './species.html',
  styleUrl: './species.css',
  imports: [SpeciesCard]
})
export class Species {
  birds: BirdSpecies[] = [];
  currentSorting: string = '';
  sortDirection: 'asc' | 'desc' = 'desc'
  startingSorting: string = 'numberDetections';



  constructor(
    private Data: Data
  ) {}

  ngOnInit() {
      this.Data.getBirds().subscribe(birds => {
      this.birds = birds;
      this.sortBirds(this.startingSorting);
    });
  }

  sortBirds(sorting: string) {
    if (sorting === this.currentSorting) {
      this.birds = this.birds.reverse();
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      if (sorting === 'Com_Name') {
        this.birds.sort((a, b) => a.Com_Name.localeCompare(b.Com_Name));
      } else if (sorting === 'numberDetections') {
        this.birds.sort((a, b) => (b.numberDetections || 0) - (a.numberDetections || 0));
      } else if ((sorting === 'percentDaily') || (sorting === 'rarity')) {
        this.birds.sort((a, b) => (b.percentDaily || 0) - (a.percentDaily || 0));
      } else if (sorting === 'percentTotal') {
        this.birds.sort((a, b) => (b.percentTotal || 0) - (a.percentTotal || 0));
      }
      this.sortDirection = 'desc'
    };

    this.currentSorting = sorting;
  }
}
