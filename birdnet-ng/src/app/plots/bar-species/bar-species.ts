import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import Plotly from 'plotly.js-dist-min';

interface DetectionDateCount {
  Date: string;
  COUNT: number;
}

@Component({
  selector: 'app-bar-species',
  imports: [],
  templateUrl: './bar-species.html',
  styleUrl: './bar-species.css'
})
export class BarSpecies {
  plotData: Plotly.Data[] = [];
  summaryItems: Array<{ label: string; value: string }> = [];
  chartAriaLabel = 'Species detection trend chart';
  hasData = false;

  private _detectionDatesCount: DetectionDateCount[] = [];
  private plotHost?: ElementRef<HTMLDivElement>;

  @ViewChild('mainPlotBar')
  set mainPlotBarRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.plotHost = ref;
    if (ref && this.hasData) {
      queueMicrotask(() => this.buildChart());
    }
  }

  @Input()
  set detectionDatesCount(newDetectionDatesCount: DetectionDateCount[]) {
    this._detectionDatesCount = newDetectionDatesCount ?? [];
    this.buildChart();
  }

  get detectionDatesCount(): DetectionDateCount[] {
    return this._detectionDatesCount;
  }

  private buildChart() {
    this.hasData = this.detectionDatesCount.length > 0;
    this.summaryItems = this.buildSummary();

    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    if (!this.hasData) {
      this.plotData = [];
      Plotly.purge(plotHost.nativeElement);
      return;
    }

    this.plotData = [{
      type: 'bar',
      x: this.detectionDatesCount.map(item => item.Date),
      y: this.detectionDatesCount.map(item => item.COUNT),
      marker: {
        color: '#3b82f6'
      },
      hovertemplate: '%{x}: %{y} detections<extra></extra>'
    }];

    this.chartAriaLabel = this.buildAriaLabel();
    this.initialisePlot();
  }

  private initialisePlot() {
    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    const compactLayout = window.innerWidth <= 768;
    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      margin: {
        l: 52,
        t: 8,
        b: compactLayout ? 88 : 108,
        r: 16
      },
      xaxis: {
        tickangle: compactLayout ? -42 : -34,
        tickfont: { size: compactLayout ? 10 : 11 },
        automargin: true,
        nticks: compactLayout ? 6 : 10,
        fixedrange: true
      },
      yaxis: {
        title: {
          text: 'Detections'
        },
        tickfont: { size: 11 },
        fixedrange: true
      }
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      displaylogo: false
    };

    Plotly.react(plotHost.nativeElement, this.plotData, layout, config);
  }

  private buildSummary() {
    if (!this.hasData) {
      return [];
    }

    const totalDetections = this.detectionDatesCount.reduce((sum, item) => sum + item.COUNT, 0);
    const peakDay = [...this.detectionDatesCount].sort((a, b) => b.COUNT - a.COUNT)[0];

    return [
      { label: 'Recorded days', value: String(this.detectionDatesCount.length) },
      { label: 'Total detections', value: String(totalDetections) },
      { label: 'Peak day', value: `${peakDay.Date} (${peakDay.COUNT})` }
    ];
  }

  private buildAriaLabel() {
    const peakDay = [...this.detectionDatesCount].sort((a, b) => b.COUNT - a.COUNT)[0];
    return `Species detection trend chart across ${this.detectionDatesCount.length} days. Peak day ${peakDay.Date} with ${peakDay.COUNT} detections.`;
  }
}
