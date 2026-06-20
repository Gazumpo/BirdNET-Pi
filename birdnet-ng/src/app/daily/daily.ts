import { Component } from '@angular/core';
import { Scatter } from '../plots/scatter/scatter';
import { BarDaily } from '../plots/bar-daily/bar-daily';
import { FormsModule } from '@angular/forms';
import { DailyStats } from "../stats/daily-stats/daily-stats"; 
import { shiftStationDate, stationToday } from '../utils/station-time';


@Component({
  selector: 'app-daily',
  imports: [Scatter, BarDaily, FormsModule, DailyStats, DailyStats],
  templateUrl: './daily.html',
  styleUrl: './daily.css'
})
export class Daily {
  date: string = stationToday();
  range: string = 'all-day'
  selectedTime: string = '50'

  onDateChange(): void {}

  previousDay(): void {
    this.date = shiftStationDate(this.date, -1);
  }

  nextDay(): void {
    this.date = shiftStationDate(this.date, 1);
  }

  today(): void {
    this.date = stationToday();
  }

  rangeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.range = selectedValue;
  }

  timeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.selectedTime = selectedValue;
  }
}
