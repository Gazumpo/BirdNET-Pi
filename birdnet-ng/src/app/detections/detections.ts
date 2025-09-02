import { Component } from '@angular/core';
import { Data } from '../services/data';
import { BirdDetection } from '../models/bird-detection.model';
import { BirdSpecies } from '../models/bird-species';
import { Ws } from '../services/ws';
import { DetectionDetail } from '../bird-components/detection-detail/detection-detail';
import { map, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [DetectionDetail],
  templateUrl: './detections.html',
  styleUrl: './detections.css'
})
export class Detections {
  latestBirds!: BirdDetection[];
  lastBird!: BirdDetection | null;
  birds: { [key: string]: BirdSpecies } = {};

  constructor(
    private Data: Data,
    private Ws: Ws 
  ) {}
  


  ngOnInit() {
    this.initialiseData(); // Call a new method to handle initial data loading

    this.Ws.messages$.pipe(
      // Use switchMap to chain the WebSocket message with data loading
      switchMap(msg => {
        console.log('Detected New Bird: ', msg);
        this.lastBird = new BirdDetection(msg);
        setTimeout(() => { this.lastBird = null; }, 30000);

        // After a new message, reload both birds and latest detections
        return forkJoin({
          birdsData: this.Data.getBirds(), // getBirds should return the dictionary directly
          latestDetectionsData: this.Data.getLatest()
        });
      })
    ).subscribe(results => {
      this.birds = results.birdsData.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
              }, {});
      this.latestBirds = results.latestDetectionsData;
    });
  }

  // New method to handle initial data loading
  initialiseData() {
    forkJoin({
      birdsData: this.Data.getBirds(), // getBirds should return the dictionary directly
      latestDetectionsData: this.Data.getLatest()
    }).subscribe(results => {
      this.birds = results.birdsData.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
      this.latestBirds = results.latestDetectionsData;
      console.log('Initial data loaded: birds', this.birds, 'latestBirds', this.latestBirds);
    });
  }

  loadSpeciesData() {
    this.Data.getLatest().subscribe(latestBirds => this.latestBirds = latestBirds);
  }

  loadBirds() {
    this.Data.getBirds().subscribe(birdsArray => {
      this.birds = birdsArray.reduce((acc, bird) => {
        acc[bird.Sci_Name] = bird;
        return acc;
      }, {});
    });
  }
}
