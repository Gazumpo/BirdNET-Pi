import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';

@Component({
  selector: 'app-bar-daily',
  imports: [],
  templateUrl: './bar-daily.html',
  styleUrl: './bar-daily.css'
})
export class BarDaily {
  todayBirds: BirdDetection[] = [];
  plotData: Plotly.Data[] = [];
  private _date!: string;

  @ViewChild('mainPlotBar', { static: true }) mainPlotBar!: ElementRef;


  constructor(
    private Data: Data
  ) {}

  // Create an @Input() setter for the date property
  @Input()
  set date(newDate: string) {
    if (this._date !== newDate) { // Check if the date has actually changed
      this._date = newDate;
      this.plotData = [];
      this.loadDaysBirds(); // Trigger data loading when the date changes
    }
  }

  get date(): string {
    return this._date;
  }

  ngOnInit() {
    //setting the date will do first plot
  }

  loadDaysBirds() {
    this.Data.getDay(this.date).subscribe(todayBirds => {
      this.todayBirds = todayBirds;
      this.createPlotData();
      this.initialisePlot();
      this.setPlotEvents();
    });
  }

  ngAfterViewInit() {
    this.initialisePlot();
  }

  setPlotEvents() {
    // Assuming 'myDiv' is the ID of your Plotly plot container
    this.mainPlotBar.nativeElement.on('plotly_hover', (data: any) => {
        console.log(data)
        if (data.points.length > 0){
            let point = data.points[0]
            let sciName = point.data.name
            let imgUrl = "birds/" + sciName.replace(" ", "_") + ".jpg"

            console.log(data.event.x, data.event.y)
            let image: Partial<Plotly.Image> = {
                source: imgUrl,
                x: 1,
                y: 1,
                sizex: 1, // Adjust size as needed
                sizey: 1,
                xanchor: "right",
                yanchor: "top",
                xref: "paper",
                yref: "paper"

            };

            Plotly.relayout(this.mainPlotBar.nativeElement, {
                images: [image]
            });
          }
        })

    this.mainPlotBar.nativeElement.on('plotly_unhover', (data: any) => {
        // Clear the image when unhovering
        Plotly.relayout(this.mainPlotBar.nativeElement, { images: [] });
    });
  };

  createPlotData() {
    const uniqueBirds = [...new Set(this.todayBirds.map(bird => bird.Com_Name))];
    console.log('Unique Birds', uniqueBirds)

    let birdSightings: { [key: string]: number } = {}
    for (const uniqueBird of uniqueBirds) {
      const birdDetections = this.todayBirds.filter(bird => bird.Com_Name === uniqueBird).length;
      birdSightings[uniqueBird] = birdDetections;
    }

    const sortedBirdSightings = Object.entries(birdSightings).sort(([, countA], [, countB]) => countB - countA);
    birdSightings = Object.fromEntries(sortedBirdSightings);

    this.plotData.push({
      type: 'bar',
      x: Object.keys(birdSightings),
      y: Object.values(birdSightings),
    })
  }

  initialisePlot() {
    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      margin: {
        l: 50,
        t: 15,
        b: 100
      }
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    };

    Plotly.newPlot(this.mainPlotBar.nativeElement, this.plotData, layout, config);
  }
}
