import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import Plotly from 'plotly.js-dist-min';

interface SpeciesAccumulationPoint {
  Date: string;
  cumulativeSpecies: number;
  newSpecies: number;
}

@Component({
  selector: 'app-species-accumulation',
  imports: [],
  templateUrl: './species-accumulation.html',
  styleUrl: './species-accumulation.css'
})
export class SpeciesAccumulation {
  hasData = false;
  summaryItems: Array<{ label: string; value: string }> = [];
  chartAriaLabel = 'Species accumulation curve';

  private _series: SpeciesAccumulationPoint[] = [];
  private plotHost?: ElementRef<HTMLDivElement>;

  @ViewChild('mainPlotAccumulation')
  set mainPlotAccumulationRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.plotHost = ref;
    if (ref && this.hasData) {
      queueMicrotask(() => this.buildChart());
    }
  }

  @Input()
  set series(newSeries: SpeciesAccumulationPoint[]) {
    this._series = newSeries ?? [];
    this.buildChart();
  }

  get series(): SpeciesAccumulationPoint[] {
    return this._series;
  }

  private buildChart() {
    this.hasData = this.series.length > 0;
    this.summaryItems = this.buildSummary();

    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    if (!this.hasData) {
      Plotly.purge(plotHost.nativeElement);
      return;
    }

    const compactLayout = window.innerWidth <= 768;
    const totalSpecies = this.series[this.series.length - 1].cumulativeSpecies;
    this.chartAriaLabel = `Species accumulation curve. ${totalSpecies} total species recorded across ${this.series.length} tracked days.`;

    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      margin: {
        l: 56,
        r: 18,
        t: 10,
        b: compactLayout ? 78 : 92
      },
      xaxis: {
        tickangle: compactLayout ? -42 : -30,
        tickfont: { size: compactLayout ? 10 : 11 },
        automargin: true,
        nticks: compactLayout ? 6 : 10,
        fixedrange: true
      },
      yaxis: {
        title: {
          text: 'Total species'
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

    const trace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      x: this.series.map(item => item.Date),
      y: this.series.map(item => item.cumulativeSpecies),
      marker: {
        size: compactLayout ? 5 : 6,
        color: '#2563eb'
      },
      line: {
        width: 3,
        color: '#2563eb'
      },
      hovertemplate: '%{x}: %{y} total species<extra></extra>'
    };

    Plotly.react(plotHost.nativeElement, [trace], layout, config);
  }

  private buildSummary() {
    if (!this.hasData) {
      return [];
    }

    const totalSpecies = this.series[this.series.length - 1].cumulativeSpecies;
    const lastNewSpecies = [...this.series].reverse().find(point => point.newSpecies > 0);

    return [
      { label: 'Total species', value: String(totalSpecies) },
      { label: 'Tracked days', value: String(this.series.length) },
      { label: 'Last new species', value: lastNewSpecies ? lastNewSpecies.Date : 'N/A' }
    ];
  }
}
