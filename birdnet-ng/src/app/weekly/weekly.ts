import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeeklyStats } from '../stats/weekly-stats/weekly-stats';

@Component({
  selector: 'app-weekly',
  imports: [FormsModule, WeeklyStats],
  templateUrl: './weekly.html',
  styleUrl: './weekly.css'
})
export class Weekly {
  date: string = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);

  onDateChange(): void {
    if (this.date) {
      console.log('The date was changed to:', this.date);
      // You can call other functions here or update your UI
    } else {
      console.log('Date was cleared.');
    }
  }

  previousWeek(): void {
    const currentDate = new Date(this.date);
    currentDate.setDate(currentDate.getDate() - 7);
    this.date = currentDate.toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
    console.log('Previous day:', this.date);
  }

  nextWeek(): void {
    const currentDate = new Date(this.date);
    currentDate.setDate(currentDate.getDate() + 7);
    this.date = currentDate.toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
    console.log('Next day:', this.date);
  }

  today(): void {
    this.date = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
  }
}
