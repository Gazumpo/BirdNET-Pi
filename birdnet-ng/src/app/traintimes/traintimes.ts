import { Component } from '@angular/core';
import { Trains } from '../services/trains';



@Component({
  selector: 'app-traintimes',
  templateUrl: './traintimes.html',
  styleUrl: './traintimes.css'
})
export class Traintimes {
  trainData: any;

  constructor(
    private Trains: Trains
  ) {}

  ngOnInit() {
    this.loadTrains();
  }


  loadTrains(): void {
    this.Trains.getLatest().subscribe({
      next: (response) => {
        this.trainData = response.data.StatusDetailList;
        console.log('Received Train Data: ', this.trainData);
      },
      error: (error) => {
        console.error('Train API Error:', error);
      }
    });
  }

  nextTrains(destination: String): Array<any> {
    if (!this.trainData) {
      return [];
    }

    let perthTimes = this.trainData.filter((train: any) => train.Destination === destination).slice(0,3);
    let minsFromNow = perthTimes.map((train: any) => this.calculateMinutesFromNow(train.Departure));

    return minsFromNow;
  }

  calculateMinutesFromNow(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const diffMillis = targetTime.getTime() - now.getTime();
    return Math.round(diffMillis / (1000 * 60));
  }

}
