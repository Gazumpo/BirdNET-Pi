import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-bar-species',
  imports: [],
  templateUrl: './bar-species.html',
  styleUrl: './bar-species.css'
})
export class BarSpecies {
  plotData: Plotly.Data[] = [];
  private _detectionDatesCount!: any

  @ViewChild('mainPlotBar', { static: true }) mainPlotBar!: ElementRef;


  constructor(
  ) {}

  @Input()
  set detectionDatesCount(newdetectionDatesCount: any) {
    console.log(newdetectionDatesCount)
    this._detectionDatesCount = newdetectionDatesCount;
    this.plotData = [];
    this.setPlotData();
    this.initialisePlot();
  }

  get detectionDatesCount(): any {
    return this._detectionDatesCount;
  }

  ngAfterViewInit() {
    this.initialisePlot();
  }

  setPlotData() {
    this.plotData.push({
      type: 'bar',
      x: this.detectionDatesCount.map((item: { Date: any; }) => item.Date),
      y: this.detectionDatesCount.map((item: { COUNT: any; }) => item.COUNT)
    })
    console.log(this.plotData)
  };

  initialisePlot() {
    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      margin: {
        l: 50,
        t: 15,
        b: 100
      },
      yaxis: {
        title: {
          text: 'Detections'
        }
      }
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
    };

    Plotly.newPlot(this.mainPlotBar.nativeElement, this.plotData, layout, config);
  }
}
