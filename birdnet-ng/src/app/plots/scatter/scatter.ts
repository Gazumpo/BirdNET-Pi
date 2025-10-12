import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';
import { Sunrise } from '../../services/sunrise';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scatter',
  imports: [],
  templateUrl: './scatter.html',
  styleUrl: './scatter.css'
})
export class Scatter {
  todayBirds: BirdDetection[] = [];
  todayDate: string = new Date().toLocaleString("en-CA", { timeZone: "Australia/Perth", hour12: false }).slice(0,10);
  todayDateTime: string = new Date().toLocaleString("en-CA", { timeZone: "Australia/Perth", hour12: false }).replace(",", "");
  plotData: Plotly.Data[] = [];
  plotWidth: number = 0;
  images: Array<Partial<Plotly.Image>> = [];
  shapes: Array<Partial<Plotly.Shape>> = [];
  annotations: Array<Partial<Plotly.Annotations>> = [];
  sunrise: any;
  private _date!: string;
  private readonly MAX_IMAGE_TIME_GAP = 60 * 30;

  @ViewChild('mainPlotScatter', { static: true }) mainPlotScatter!: ElementRef;

  constructor(
    private Data: Data,
    private Sunrise: Sunrise,
    private router: Router
  ) {}

  // ------
  @Input()
  set date(newDate: string) {
    if (this._date !== newDate) { // Check if the date has actually changed
      this._date = newDate;
      this.loadData(); // Trigger data loading when the date changes
    }
  }

  get date(): string {
    return this._date;
  }

  ngOnInit() {
  }

  loadData() {
    forkJoin({
      todayBirds: this.Data.getDay(this.date),
      sunrise: this.Sunrise.getSunrise(this.date)
    }).subscribe(results => {
      this.todayBirds = results.todayBirds;
      this.sunrise = results.sunrise
      console.log('sunrise response', this.sunrise)

      this.plotData = [];
      this.images = [];
      this.shapes = [];
      this.annotations = [];
      
      this.createPlotData();
      this.createBackground();
      this.initialisePlot();
      this.setPlotEvents()
    })
  }

  ngAfterViewInit() {
    //this.initialisePlot();
  }

  setPlotEvents() {

    this.mainPlotScatter.nativeElement.on('plotly_click', (data: any) => {
        const clickedPoint = data.points[0].data.name;
        console.log('Clicked Point:', clickedPoint);

        this.router.navigate(['/species-detail', clickedPoint]);
    });
  };

  createPlotData() {
    const uniqueBirds = [...new Set(this.todayBirds.map(bird => bird.Com_Name))];
    console.log('Unique Birds', uniqueBirds)

    this.plotWidth = this.mainPlotScatter.nativeElement.clientWidth;

    for (const uniqueBird of uniqueBirds) {
      const birdDetections = this.todayBirds.filter(bird => bird.Com_Name === uniqueBird);
      let yTitle = uniqueBird+ " (" + birdDetections.length + ")";

      let times = [];
      let songUrls = [];
      let lastTime = "00:00:00"
      for (const detection of birdDetections) {
        times.push(detection.Date + ' ' + detection.Time)
        songUrls.push(detection.birdsongUrl)

        let timeFromLast = this.calculateTimeDifferenceInSeconds(detection.Time, lastTime)
        if (timeFromLast && timeFromLast > this.MAX_IMAGE_TIME_GAP) {
          this.images.push({
            source: "birds/" + detection.Sci_Name.replace(" ", "_") + "_mark.png",
            xref: "x",
            yref: "y",
            x: detection.Date + ' ' + detection.Time,
            y: yTitle, 
            sizing: "contain",
            sizex: 1.4*60*60*10000, 
            sizey: 1.1,
            xanchor: "center",
            yanchor: "middle"
            //layer: "above"
          })
          lastTime = detection.Time
        }
        
      }
      let names = Array.from({length: times.length}, () => yTitle)

      // Push a new trace object for each bird into the plotData array
      this.plotData.push({
          type: 'scatter',
          x: times,
          y: names,
          mode: 'markers',
          name: birdDetections[0].Sci_Name,
          marker: {
            size: 18,
            opacity: 0
          }
      }); 
    };
    this.plotData.sort((a: any, b: any) => {
      // reorder by number of sightings
      const xA = a.x as any[];
      const xB = b.x as any[];
      return xA.length - xB.length;
    });

    for (const trace of this.plotData) {
      // y is an array of repeated category names
      const scatterTrace = trace as Plotly.ScatterData;
      const category = scatterTrace.y?.[0] as string;
      this.annotations.push({
        xref: 'paper',
        yref: 'y',
        x: 0, // left edge of the plot
        y: category,
        xanchor: 'left',
        showarrow: false,
        text: category,
        font: {
          size: 12,
          color: 'white'
        },
        align: 'left'
      });
    }
    console.log(this.annotations)
  }

  calculateTimeDifferenceInSeconds(time1Str: string, time2Str: string) {
    // Helper function to convert a single time string to total seconds.
    const toSeconds = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      // Ensure the format is valid (three numeric parts).
      if (parts.length !== 3 || parts.some(isNaN)) {
        return null;
      }
      const [hours, minutes, seconds] = parts;
      return (hours * 3600) + (minutes * 60) + seconds;
    };

    const totalSeconds1 = toSeconds(time1Str);
    const totalSeconds2 = toSeconds(time2Str);

    // Return null if either time string was invalid.
    if (totalSeconds1 === null || totalSeconds2 === null) {
      return null;
    }

    // Calculate and return the absolute difference.
    return Math.abs(totalSeconds1 - totalSeconds2);
  }

  createBackground() {
    let twiStart = this.sunrise.results.astronomical_twilight_begin;
    let nautStart = this.sunrise.results.nautical_twilight_begin;
    let civilStart = this.sunrise.results.civil_twilight_begin;
    let sunrise = this.sunrise.results.sunrise;
    
    let sunset = this.sunrise.results.sunset;
    let civilEnd= this.sunrise.results.civil_twilight_end;
    let nautEnd = this.sunrise.results.nautical_twilight_end;
    let twiEnd = this.sunrise.results.astronomical_twilight_end;

    let dayShades = [{
      start: this.date + ' 00:00',
      end: this.date + ' ' + twiStart,
      color: 'rgb(23,41,51)'
    },
    {
      start: this.date + ' ' + twiStart,
      end: this.date + ' ' + nautStart,
      color: 'rgb(34,63,77)'
    },
    {
      start: this.date + ' ' + nautStart,
      end: this.date + ' ' + civilStart,
      color: 'rgb(61,100,117)'
    },
    {
      start: this.date + ' ' + civilStart,
      end: this.date + ' ' + sunrise,
      color: 'rgb(117,179,204)'
    },
    {
      start: this.date + ' ' + sunrise,
      end: this.date + ' ' + sunset,
      color: 'rgb(185,217,228)'
    },
    {
      start: this.date + ' ' + sunset,
      end: this.date + ' ' + civilEnd,
      color: 'rgb(117,179,204)'
    },
    {
      start: this.date + ' ' + civilEnd,
      end: this.date + ' ' + nautEnd,
      color: 'rgb(61,100,117)'
    },
    {
      start: this.date + ' ' + nautEnd,
      end: this.date + ' ' + twiEnd,
      color: 'rgb(34,63,77)'
    },
    {
      start: this.date + ' ' + twiEnd,
      end: this.date + ' 23:59',
      color: 'rgb(23,41,51)'
    }]

    for (const shade of dayShades) {
      this.shapes.push(
        {
            'type': 'rect',
            'xref': 'x',
            'yref': 'paper',
            'x0': shade.start,
            'y0': 0,
            'x1': shade.end,
            'y1': 1,
            'fillcolor': shade.color,
            'opacity': 1.0,
            'line': {
                'width': 0,
            },
            layer: 'below'
        },
      )
    }

    this.shapes.push(
      {
          'type': 'line',
          'xref': 'x',
          'yref': 'paper',
          'x0': new Date().toLocaleString("en-CA", { timeZone: "Australia/Perth", hour12: false }).replace(',', ''),
          'y0': 0,
          'x1': new Date().toLocaleString("en-CA", { timeZone: "Australia/Perth", hour12: false }).replace(',', ''),
          'y1': 1,
          'opacity': 1.0,
          'line': {
              'width': 1,
              color: '#fff647ff'
          },
          layer: 'below'
      }
    )
  }

  initialisePlot() {
    let xAxisEnd: string;
    if (this.date == this.todayDate) {
      xAxisEnd = this.todayDateTime;
      console.log('set end xaxis as ', xAxisEnd)
    } else {
      xAxisEnd = this.date + ' 23:59';
    } 

    const layout: Partial<Plotly.Layout> = {
      xaxis: { 
        range: [this.date + ' 00:00', xAxisEnd],
        fixedrange: true,
        showgrid: false,
        tickformat: '%H:%M'
      },
      yaxis: {
        type: 'category',
        fixedrange: true,
        showticklabels: false,
        showgrid: true,
        griddash: 'dash',
        gridcolor: '#2741abff'
      },
      images: this.images,
      shapes: this.shapes,
      annotations: this.annotations,
      showlegend: false,
      margin: {
        l: 20,
        t: 15,
        b: 40,
        r: 10
      }
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
      scrollZoom: false // Disables zoom with mouse wheel
    };

    Plotly.newPlot(this.mainPlotScatter.nativeElement, this.plotData, layout, config);
  }
}
