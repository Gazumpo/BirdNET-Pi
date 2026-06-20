import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpeciesCard } from './species-card/species-card';
import { BirdSpecies } from '../models/bird-species';
import { Data } from '../services/data';

@Component({
  selector: 'app-species',
  templateUrl: './species.html',
  styleUrl: './species.css',
  imports: [SpeciesCard, FormsModule]
})
export class Species {
  birds: BirdSpecies[] = [];
  filteredBirds: BirdSpecies[] = [];
  currentSorting = '';
  sortDirection: 'asc' | 'desc' = 'desc';
  startingSorting = 'numberDetections';
  searchTerm = '';
  rarityFilter = 'all';
  minDetections = 0;
  filtersExpanded = false;
  loading = true;
  errorMessage = '';

  constructor(
    private data: Data
  ) {}

  ngOnInit() {
    this.data.getBirds().subscribe({
      next: birds => {
        this.birds = birds;
        this.sortBirds(this.startingSorting);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load species right now.';
      }
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
      } else if (sorting === 'rarity') {
        this.birds.sort((a, b) => (b.percentDaily || 0) - (a.percentDaily || 0));
      } else if (sorting === 'percentTotal') {
        this.birds.sort((a, b) => (b.percentTotal || 0) - (a.percentTotal || 0));
      }
      this.sortDirection = sorting === 'Com_Name' ? 'asc' : 'desc';
    }

    this.currentSorting = sorting;
    this.applyFilters();
  }

  applyFilters() {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();

    this.filteredBirds = this.birds.filter(bird => {
      const matchesSearch = normalizedTerm === ''
        || bird.Com_Name.toLowerCase().includes(normalizedTerm)
        || bird.Sci_Name.toLowerCase().includes(normalizedTerm);
      const matchesRarity = this.rarityFilter === 'all'
        || (bird.rarity?.toLowerCase().replace(' ', '-') ?? '') === this.rarityFilter;
      const matchesDetections = (bird.numberDetections ?? 0) >= this.minDetections;

      return matchesSearch && matchesRarity && matchesDetections;
    });
  }

  hasActiveFilters() {
    return this.searchTerm.trim() !== ''
      || this.rarityFilter !== 'all'
      || this.minDetections !== 0;
  }

  activeFilterCount() {
    return [
      this.searchTerm.trim() !== '',
      this.rarityFilter !== 'all',
      this.minDetections !== 0
    ].filter(Boolean).length;
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  clearFilters() {
    this.searchTerm = '';
    this.rarityFilter = 'all';
    this.minDetections = 0;
    this.filtersExpanded = false;
    this.applyFilters();
  }
}
