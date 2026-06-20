import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';
import { Sunrise } from '../../services/sunrise';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { stationNowDateTime, stationToday } from '../../utils/station-time';

interface SpeciesTimelineGroup {
  commonName: string;
  sciName: string;
  count: number;
  displayLabel: string;
  times: string[];
}

@Component({
  selector: 'app-scatter',
  imports: [],
  templateUrl: './scatter.html',
  styleUrl: './scatter.css'
})
export class Scatter {
  todayBirds: BirdDetection[] = [];
  todayDate = stationToday();
  todayDateTime = stationNowDateTime();
  plotData: Plotly.Data[] = [];
  images: Array<Partial<Plotly.Image>> = [];
  shapes: Array<Partial<Plotly.Shape>> = [];
  annotations: Array<Partial<Plotly.Annotations>> = [];
  summaryItems: Array<{ label: string; value: string }> = [];
  chartAriaLabel = 'Daily bird timeline chart';
  sunrise: any;
  loading = true;
  errorMessage = '';
  hasData = false;
  isCompactLayout = false;

  private _date!: string;
  private readonly maxImageTimeGap = 60 * 30;
  private plotEventsBound = false;
  private plotHost?: ElementRef<HTMLDivElement>;

  @ViewChild('mainPlotScatter')
  set mainPlotScatterRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.plotHost = ref;
    if (ref && this.hasData) {
      queueMicrotask(() => this.buildChart());
    }
  }

  constructor(
    private data: Data,
    private sunriseService: Sunrise,
    private router: Router
  ) {}

  @Input()
  set date(newDate: string) {
    if (this._date !== newDate) {
      this._date = newDate;
      this.loadData();
    }
  }

  get date(): string {
    return this._date;
  }

  private loadData() {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      todayBirds: this.data.getDay(this.date),
      sunrise: this.sunriseService.getSunrise(this.date)
    }).subscribe({
      next: results => {
        this.todayBirds = results.todayBirds;
        this.sunrise = results.sunrise;
        this.loading = false;
        queueMicrotask(() => this.buildChart());
      },
      error: () => {
        this.errorMessage = 'Unable to load the daily timeline chart.';
        this.loading = false;
        this.hasData = false;
      }
    });
  }

  private buildChart() {
    this.todayDate = stationToday();
    this.todayDateTime = stationNowDateTime();
    this.isCompactLayout = window.innerWidth <= 768;

    const grouped = this.groupBySpecies(this.todayBirds);
    this.hasData = grouped.length > 0;
    this.summaryItems = this.buildSummary(grouped);

    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    if (!this.hasData) {
      this.plotData = [];
      Plotly.purge(plotHost.nativeElement);
      return;
    }

    this.images = [];
    this.shapes = [];
    this.annotations = [];
    this.plotData = [];

    const chartGroups = [...grouped].reverse();
    this.createPlotData(chartGroups);
    this.createBackground();
    this.chartAriaLabel = this.buildAriaLabel(grouped);
    this.initialisePlot();
    this.setPlotEvents();
  }

  private groupBySpecies(detections: BirdDetection[]): SpeciesTimelineGroup[] {
    const groups = detections.reduce((acc, detection) => {
      const existing = acc.get(detection.Sci_Name);
      const times = existing?.times ?? [];
      times.push(`${detection.Date} ${detection.Time}`);

      acc.set(detection.Sci_Name, {
        commonName: detection.Com_Name,
        sciName: detection.Sci_Name,
        count: times.length,
        displayLabel: '',
        times
      });

      return acc;
    }, new Map<string, SpeciesTimelineGroup>());

    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count || a.commonName.localeCompare(b.commonName))
      .map(group => ({
        ...group,
        displayLabel: this.formatDisplayLabel(group.commonName, group.count)
      }));
  }

  private createPlotData(groups: SpeciesTimelineGroup[]) {
    for (const group of groups) {
      let lastTime = '00:00:00';

      for (const timestamp of group.times) {
        const detectionTime = timestamp.split(' ')[1];
        const timeFromLast = this.calculateTimeDifferenceInSeconds(detectionTime, lastTime);
        if (timeFromLast && timeFromLast > this.maxImageTimeGap) {
          this.images.push({
            source: `birds/${this.toAssetName(group.sciName)}_mark.png`,
            xref: 'x',
            yref: 'y',
            x: timestamp,
            y: group.displayLabel,
            sizing: 'contain',
            sizex: this.isCompactLayout ? 0.9 * 60 * 60 * 1000 : 1.35 * 60 * 60 * 1000,
            sizey: this.isCompactLayout ? 0.86 : 1.08,
            xanchor: 'center',
            yanchor: 'middle'
          });
          lastTime = detectionTime;
        }
      }

      this.plotData.push({
        type: 'scatter',
        x: group.times,
        y: Array.from({ length: group.times.length }, () => group.displayLabel),
        customdata: Array.from({ length: group.times.length }, () => group.sciName),
        mode: 'markers',
        name: group.sciName,
        marker: {
          size: this.isCompactLayout ? 14 : 18,
          opacity: 0
        },
        hovertemplate: `${group.commonName}: %{x|%H:%M}<extra></extra>`
      });
    }

    for (const group of groups) {
      this.annotations.push({
        xref: 'paper',
        yref: 'y',
        x: 0.008,
        y: group.displayLabel,
        xanchor: 'left',
        showarrow: false,
        text: group.displayLabel,
        font: {
          size: this.isCompactLayout ? 11 : 12,
          color: 'white'
        },
        align: 'left'
      });
    }
  }

  private calculateTimeDifferenceInSeconds(time1Str: string, time2Str: string) {
    const toSeconds = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) {
        return null;
      }
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    };

    const totalSeconds1 = toSeconds(time1Str);
    const totalSeconds2 = toSeconds(time2Str);
    if (totalSeconds1 === null || totalSeconds2 === null) {
      return null;
    }

    return Math.abs(totalSeconds1 - totalSeconds2);
  }

  private createBackground() {
    const twiStart = this.sunrise.results.astronomical_twilight_begin;
    const nautStart = this.sunrise.results.nautical_twilight_begin;
    const civilStart = this.sunrise.results.civil_twilight_begin;
    const sunrise = this.sunrise.results.sunrise;
    const sunset = this.sunrise.results.sunset;
    const civilEnd = this.sunrise.results.civil_twilight_end;
    const nautEnd = this.sunrise.results.nautical_twilight_end;
    const twiEnd = this.sunrise.results.astronomical_twilight_end;

    const dayShades = [
      { start: `${this.date} 00:00`, end: `${this.date} ${twiStart}`, color: 'rgb(23,41,51)' },
      { start: `${this.date} ${twiStart}`, end: `${this.date} ${nautStart}`, color: 'rgb(34,63,77)' },
      { start: `${this.date} ${nautStart}`, end: `${this.date} ${civilStart}`, color: 'rgb(61,100,117)' },
      { start: `${this.date} ${civilStart}`, end: `${this.date} ${sunrise}`, color: 'rgb(117,179,204)' },
      { start: `${this.date} ${sunrise}`, end: `${this.date} ${sunset}`, color: 'rgb(185,217,228)' },
      { start: `${this.date} ${sunset}`, end: `${this.date} ${civilEnd}`, color: 'rgb(117,179,204)' },
      { start: `${this.date} ${civilEnd}`, end: `${this.date} ${nautEnd}`, color: 'rgb(61,100,117)' },
      { start: `${this.date} ${nautEnd}`, end: `${this.date} ${twiEnd}`, color: 'rgb(34,63,77)' },
      { start: `${this.date} ${twiEnd}`, end: `${this.date} 23:59`, color: 'rgb(23,41,51)' }
    ];

    for (const shade of dayShades) {
      this.shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: shade.start,
        y0: 0,
        x1: shade.end,
        y1: 1,
        fillcolor: shade.color,
        opacity: 1,
        line: { width: 0 },
        layer: 'below'
      });
    }

    if (this.date === this.todayDate) {
      this.shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: stationNowDateTime(),
        y0: 0,
        x1: stationNowDateTime(),
        y1: 1,
        opacity: 1,
        line: {
          width: 1,
          color: '#fff647ff'
        },
        layer: 'below'
      });
    }
  }

  private initialisePlot() {
    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    const xAxisEnd = this.date === this.todayDate ? this.todayDateTime : `${this.date} 23:59`;
    const layout: Partial<Plotly.Layout> = {
      xaxis: {
        range: [`${this.date} 00:00`, xAxisEnd],
        fixedrange: true,
        showgrid: false,
        tickformat: '%H:%M',
        nticks: this.isCompactLayout ? 6 : 10,
        tickfont: { size: this.isCompactLayout ? 11 : 12 }
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
        l: 10,
        t: 12,
        b: 42,
        r: 10
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
      scrollZoom: false
    };

    Plotly.react(plotHost.nativeElement, this.plotData, layout, config);
  }

  private setPlotEvents() {
    if (this.plotEventsBound) {
      return;
    }

    const plotElement = this.plotHost?.nativeElement as any;
    if (!plotElement) {
      return;
    }

    plotElement.on('plotly_click', (data: any) => {
      const sciName = data.points?.[0]?.customdata;
      if (sciName) {
        this.router.navigate(['/species-detail', sciName]);
      }
    });

    this.plotEventsBound = true;
  }

  private buildSummary(groups: SpeciesTimelineGroup[]) {
    if (groups.length === 0) {
      return [];
    }

    return [
      { label: 'Species', value: String(groups.length) },
      { label: 'Detections', value: String(this.todayBirds.length) },
      {
        label: 'Busiest birds',
        value: groups.slice(0, 3).map(group => `${group.commonName} (${group.count})`).join(', ')
      }
    ];
  }

  private buildAriaLabel(groups: SpeciesTimelineGroup[]) {
    const leaders = groups.slice(0, 3).map(group => `${group.commonName} with ${group.count} detections`).join(', ');
    return `Daily timeline chart for ${this.date}. ${this.todayBirds.length} detections across ${groups.length} species. Most active birds: ${leaders}.`;
  }

  private formatDisplayLabel(commonName: string, count: number) {
    const base = `${commonName} (${count})`;
    const maxLength = this.isCompactLayout ? 22 : 30;
    return base.length > maxLength ? `${base.slice(0, maxLength - 1)}…` : base;
  }

  private toAssetName(value: string) {
    return value.replace(/ /g, '_');
  }
}
