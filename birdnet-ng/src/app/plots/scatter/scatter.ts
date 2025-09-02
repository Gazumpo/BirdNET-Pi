import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';
import { Sunrise } from '../../services/sunrise';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-scatter',
  imports: [],
  templateUrl: './scatter.html',
  styleUrl: './scatter.css'
})
export class Scatter {
  todayBirds: BirdDetection[] = [];
  plotData: Plotly.Data[] = [];
  images: Array<Partial<Plotly.Image>> = [];
  shapes: Array<Partial<Plotly.Shape>> = [];
  sunrise: any;
  private _date!: string;

  @ViewChild('mainPlotScatter', { static: true }) mainPlotScatter!: ElementRef;

  constructor(
    private Data: Data,
    private Sunrise: Sunrise,
    private router: Router
  ) {}

  // Create an @Input() setter for the date property
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

  ngOnInit() {}



  loadData() {
    forkJoin({
      todayBirds: this.Data.getDay(this.date),
      sunrise: this.Sunrise.getSunrise(this.date)
    }).subscribe(results => {
      this.todayBirds = results.todayBirds;
      this.sunrise = results.sunrise
      this.plotData = [];
      this.images = [];
      this.shapes = [];
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
    // Assuming 'myDiv' is the ID of your Plotly plot container
    // this.mainPlotScatter.nativeElement.on('plotly_hover', (data: any) => {
    //     console.log(data)
    //     if (data.points.length > 0){
    //         let point = data.points[0]
    //         let sciName = point.data.name
    //         let imgUrl = "birds/" + sciName.replace(" ", "_") + ".jpg"

    //         let image: Partial<Plotly.Image> = {
    //             source: imgUrl,
    //             x: 1,
    //             y: 1,
    //             sizex: 0.3, // Adjust size as needed
    //             sizey: 0.3,
    //             xanchor: "right",
    //             yanchor: "top",
    //             xref: "paper",
    //             yref: "paper"
    //         };

    //         Plotly.relayout(this.mainPlotScatter.nativeElement, {
    //             images: [image]
    //         });
    //       }
    //     })

    // this.mainPlotScatter.nativeElement.on('plotly_unhover', (data: any) => {
    //     // Clear the image when unhovering
    //     Plotly.relayout(this.mainPlotScatter.nativeElement, { images: [] });
    // });

    this.mainPlotScatter.nativeElement.on('plotly_click', (data: any) => {
        const clickedPoint = data.points[0].data.name;
        console.log('Clicked Point:', clickedPoint);

        this.router.navigate(['/species-detail', clickedPoint]);
    });
  };

  createPlotData() {
    const uniqueBirds = [...new Set(this.todayBirds.map(bird => bird.Com_Name))];
    console.log('Unique Birds', uniqueBirds)

    for (const uniqueBird of uniqueBirds) {
      const birdDetections = this.todayBirds.filter(bird => bird.Com_Name === uniqueBird);
      let yTitle = uniqueBird+ " (" + birdDetections.length + ")"

      let times = [];
      let songUrls = [];
      for (const detection of birdDetections) {
        times.push(detection.Date + ' ' + detection.Time)
        songUrls.push(detection.birdsongUrl)
        this.images.push({
          source: "birds/" + detection.Sci_Name.replace(" ", "_") + "_mark.png",
          xref: "x",
          yref: "y",
          x: detection.Date + ' ' + detection.Time,
          y: yTitle, 
          sizex: 1.4*60*60*1000, 
          sizey: 8,
          xanchor: "center",
          yanchor: "middle"
          //layer: "above"
        })
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
  }

  createBackground() {
    let twiStart = new Date('1970/01/01 ' + this.sunrise.results.astronomical_twilight_begin).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let nautStart = new Date('1970/01/01 ' + this.sunrise.results.nautical_twilight_begin).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let civilStart = new Date('1970/01/01 ' + this.sunrise.results.civil_twilight_begin).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let sunrise = new Date('1970/01/01 ' + this.sunrise.results.sunrise).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let sunset = new Date('1970/01/01 ' + this.sunrise.results.sunset).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let civilEnd= new Date('1970/01/01 ' + this.sunrise.results.civil_twilight_end).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let nautEnd = new Date('1970/01/01 ' + this.sunrise.results.nautical_twilight_end).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let twiEnd = new Date('1970/01/01 ' + this.sunrise.results.astronomical_twilight_end).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

    const layout: Partial<Plotly.Layout> = {
      xaxis: { 
        range: [this.date + ' 00:00', this.date + ' 23:59'],
        fixedrange: true,
        showgrid: false,
        tickformat: '%H:%M'
      },
      yaxis: {
        type: 'category',
        fixedrange: true,
        showticklabels: true,
        showgrid: true,
        griddash: 'dash',
        gridcolor: '#2741abff'
      },
      images: this.images,
      shapes: this.shapes,
      showlegend: false,
      margin: {
        l: 200,
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
