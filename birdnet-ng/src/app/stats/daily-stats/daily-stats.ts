import { Component, Input } from '@angular/core';
import { Data } from '../../services/data';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BirdSpecies } from '../../models/bird-species';


@Component({
  selector: 'app-daily-stats',
  imports: [],
  templateUrl: './daily-stats.html',
  styleUrl: './daily-stats.css'
})
export class DailyStats {
  stats: any;
  private _date!: string;
  birds: { [key: string]: BirdSpecies } = {};

  constructor(
    private Data: Data,
    private router: Router
  ) {}

  // Create an @Input() setter for the date property
  @Input()
  set date(newDate: string) {
    if (this._date !== newDate) { // Check if the date has actually changed
      this._date = newDate;
      this.loadDaysStats(); // Trigger data loading when the date changes
    }
  }

  get date(): string {
    return this._date;
  }

  ngOnInit() {
  }

  loadDaysStats() {
    forkJoin({
      stats: this.Data.getStatsDay(this.date),
      birds: this.Data.getBirds()
    }).subscribe(results => {
      this.stats = results.stats;
      this.birds = results.birds.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
      this.processStats();
    });
  }

  processStats() {
    this.stats.rareSpeciesToday = this.stats.speciesToday.filter((Sci_Name: string) => {
      const bird = this.birds[Sci_Name];
      return bird && (bird.rarity === "Rare" || bird.rarity === "Very Rare");
    }).map((Sci_Name: string) => {
      const bird = this.birds[Sci_Name];
      return {
        Sci_Name: bird.Sci_Name,
        Com_Name: bird.Com_Name,
      };
    });
  }

  goToBirdDetail(Sci_Name: string) {
    this.router.navigate(['/species-detail', Sci_Name]);
  }
}
