import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeeklyStats } from '../stats/weekly-stats/weekly-stats';
import { shiftStationDate, stationToday } from '../utils/station-time';

@Component({
  selector: 'app-weekly',
  imports: [FormsModule, WeeklyStats],
  templateUrl: './weekly.html',
  styleUrl: './weekly.css'
})
export class Weekly {
  date: string = stationToday();

  onDateChange(): void {}

  previousWeek(): void {
    this.date = shiftStationDate(this.date, -7);
  }

  nextWeek(): void {
    this.date = shiftStationDate(this.date, 7);
  }

  today(): void {
    this.date = stationToday();
  }
}
