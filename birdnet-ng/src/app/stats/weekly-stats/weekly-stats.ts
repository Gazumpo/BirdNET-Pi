import { Component, Input } from '@angular/core';
import { Data } from '../../services/data';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BirdSpecies } from '../../models/bird-species';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-weekly-stats',
  imports: [DatePipe],
  templateUrl: './weekly-stats.html',
  styleUrl: './weekly-stats.css'
})
export class WeeklyStats {
  stats: any;
  private _date!: string;
  date1!: string;
  date2!: string;
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
      this.date1 = this.getLastMonday(newDate).toISOString().split('T')[0];
      console.log(this.date1) 
      this.date2 = new Date(new Date(newDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log(this.date2)
      this.loadWeeksStats(); // Trigger data loading when the date changes
    }
  }

  get date(): string {
    return this._date;
  }

  ngOnInit() {
  }

  loadWeeksStats() {
    forkJoin({
      stats: this.Data.getStatsRange(this.date1, this.date2),
      birds: this.Data.getBirds()
    }).subscribe(results => {
      this.stats = results.stats;
      console.log(results.stats)
      this.birds = results.birds.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
      this.processStats()
      console.log(this.stats)
    })
    

  }

  processStats() {
    this.stats.rareSpecies = this.stats.birds.filter((species: any) => {
      const bird = this.birds[species.Sci_Name];
      return bird && (bird.rarity === "Rare");
    }).map((species: any) => {
      const bird = this.birds[species.Sci_Name];
      return {
        Sci_Name: bird.Sci_Name,
        Com_Name: bird.Com_Name,
      };
    });
    this.stats.veryRareSpecies = this.stats.birds.filter((species: any) => {
      const bird = this.birds[species.Sci_Name];
      return bird && (bird.rarity === "Very Rare");
    }).map((species: any) => {
      const bird = this.birds[species.Sci_Name];
      return {
        Sci_Name: bird.Sci_Name,
        Com_Name: bird.Com_Name,
      };
    });
  }

  getLastMonday(date: string) {
    const newDate = new Date(date); // Create a copy to avoid modifying the original
    const dayOfWeek = newDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days to subtract to reach the last Monday
    // If today is Monday (1), we subtract 7 days to get the Monday of the previous week.
    // Otherwise, we calculate how many days back to get to the previous Monday.
    const daysToSubtract = (dayOfWeek === 1) ? 7 : (dayOfWeek + 6) % 7;

    newDate.setDate(newDate.getDate() - daysToSubtract);
    return newDate;
  }

  goToBirdDetail(Sci_Name: string) {
    this.router.navigate(['/species-detail', Sci_Name]);
  }
}

