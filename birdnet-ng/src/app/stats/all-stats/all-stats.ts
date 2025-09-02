import { Component, Input } from '@angular/core';
import { Data } from '../../services/data';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BirdSpecies } from '../../models/bird-species';

@Component({
  selector: 'app-all-stats',
  imports: [],
  templateUrl: './all-stats.html',
  styleUrl: './all-stats.css'
})
export class AllStats {
  stats: any;
  birds: { [key: string]: BirdSpecies } = {};

  constructor(
    private Data: Data,
    private router: Router
  ) {}

  ngOnInit() {
    forkJoin({
      stats: this.Data.getStatsAll(),
      birds: this.Data.getBirds()
    }).subscribe(results => {
      this.stats = results.stats;
      console.log('all stat', results.stats)
      this.birds = results.birds.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
      this.processStats()
      console.log(this.stats)
    })
  }

  processStats() {
  }

  showSpecies() {
    this.router.navigate(['/species']);
  }
}

