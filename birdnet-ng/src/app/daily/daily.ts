import { Component } from '@angular/core';
import { Scatter } from '../plots/scatter/scatter';
import { BarDaily } from '../plots/bar-daily/bar-daily';
import { FormsModule } from '@angular/forms';
import { DailyStats } from "../stats/daily-stats/daily-stats"; 


@Component({
  selector: 'app-daily',
  imports: [Scatter, BarDaily, FormsModule, DailyStats, DailyStats],
  templateUrl: './daily.html',
  styleUrl: './daily.css'
})
export class Daily {
  date: string = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);

  onDateChange(): void {
    if (this.date) {
      console.log('The date was changed to:', this.date);
      // You can call other functions here or update your UI
    } else {
      console.log('Date was cleared.');
    }
  }

  previousDay(): void {
    const currentDate = new Date(this.date);
    currentDate.setDate(currentDate.getDate() - 1);
    this.date = currentDate.toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
    console.log('Previous day:', this.date);
  }

  nextDay(): void {
    const currentDate = new Date(this.date);
    currentDate.setDate(currentDate.getDate() + 1);
    this.date = currentDate.toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
    console.log('Next day:', this.date);
  }

  today(): void {
    this.date = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
  }
}
