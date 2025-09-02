import { Component, ViewChild, ElementRef} from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';

@Component({
  selector: 'app-violin',
  imports: [],
  templateUrl: './violin.html',
  styleUrl: './violin.css'
})
export class Violin {
  todayBirds: BirdDetection[] = [];
  plotData: Plotly.Data[] = [];

  @ViewChild('mainPlotViolin', { static: true }) mainPlotViolin!: ElementRef;


  constructor(
    private Data: Data
  ) {}

  ngOnInit() {
    this.loadTodayBirds();
  }

  loadTodayBirds() {
    this.Data.getToday().subscribe(todayBirds => {
      this.todayBirds = todayBirds;
      this.createPlotData();
      this.initialisePlot();
      console.log(this.todayBirds)
    });
  }

  ngAfterViewInit() {
    this.initialisePlot();
  }

  createPlotData() {
    const uniqueBirds = [...new Set(this.todayBirds.map(bird => bird.Com_Name))];
    console.log('Unique Birds', uniqueBirds)

    let birdsHourly: { [key: string]: number[] }  = {}
    let birdsCounts: { [key: string]: number }  = {}


    for (const uniqueBird of uniqueBirds) {
      birdsHourly[uniqueBird] = []
      const birdDetections = this.todayBirds.filter(bird => bird.Com_Name === uniqueBird);
      for (const detection of birdDetections) {
        let detectionTime = parseInt(detection.Time.slice(0,2))
        birdsHourly[uniqueBird].push(detectionTime)
      }

      let maxCount = 0;
      const counts: { [key: number]: number } = {};
      for (const time of birdsHourly[uniqueBird]) {
        counts[time] = (counts[time] || 0) + 1;
        if (counts[time] > maxCount) {
          maxCount = counts[time];
        }
      }
      birdsCounts[uniqueBird] = maxCount;
    }

    let maxSightings = Math.max(...Object.values(birdsCounts))

    for (const uniqueBird of uniqueBirds) {
      let width = birdsCounts[uniqueBird] / maxSightings

      // Push a new trace object for each bird into the plotData array
      this.plotData.push({
          type: 'violin',
          x: birdsHourly[uniqueBird],
          points: false,
          boxpoints: false,
          opacity: 0.6,
          y0: uniqueBird,
          side: 'positive',
          scalegroup: 'common_scale',
          scalemode: 'count',
          width: width * 3
      }); 
    };
    this.plotData.sort((a: any, b: any) => {
      // reorder by number of sightings
      const xA = a.x as any[];
      const xB = b.x as any[];
      return xA.length - xB.length;
    });

  }

  initialisePlot() {
    const layout: Partial<Plotly.Layout> = {
      xaxis: { 
        title: {
          text: 'Spottings' 
        },
        ticktext: Array.from({length: 25}, (_, i) => i.toString().padStart(2, '0') + ':00'),
        tickvals: Array.from({length: 25}, (_, i) => i),
      },
      showlegend: false,
      margin: {
        l: 200,
        t: 30
      }
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    };

    Plotly.newPlot(this.mainPlotViolin.nativeElement, this.plotData, layout, config);
  }
}