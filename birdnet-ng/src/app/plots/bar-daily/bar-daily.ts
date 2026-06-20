import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { BirdDetection } from '../../models/bird-detection.model';
import { Data } from '../../services/data';

interface SpeciesCountItem {
  name: string;
  sciName: string;
  count: number;
}

@Component({
  selector: 'app-bar-daily',
  imports: [],
  templateUrl: './bar-daily.html',
  styleUrl: './bar-daily.css'
})
export class BarDaily {
  todayBirds: BirdDetection[] = [];
  plotData: Plotly.Data[] = [];
  summaryItems: Array<{ label: string; value: string }> = [];
  chartAriaLabel = 'Daily species activity chart';
  loading = true;
  errorMessage = '';
  hasData = false;
  isCompactLayout = false;

  private _date!: string;
  private plotEventsBound = false;
  private speciesCounts: SpeciesCountItem[] = [];
  private plotHost?: ElementRef<HTMLDivElement>;

  @ViewChild('mainPlotBar')
  set mainPlotBarRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.plotHost = ref;
    if (ref && this.hasData) {
      queueMicrotask(() => this.buildChart());
    }
  }

  constructor(private data: Data) {}

  @Input()
  set date(newDate: string) {
    if (this._date !== newDate) {
      this._date = newDate;
      this.loadDaysBirds();
    }
  }

  get date(): string {
    return this._date;
  }

  private loadDaysBirds() {
    this.loading = true;
    this.errorMessage = '';

    this.data.getDay(this.date).subscribe({
      next: todayBirds => {
        this.todayBirds = todayBirds;
        this.loading = false;
        queueMicrotask(() => this.buildChart());
      },
      error: () => {
        this.errorMessage = 'Unable to load the daily species chart.';
        this.loading = false;
        this.hasData = false;
      }
    });
  }

  private buildChart() {
    const grouped = this.countSpecies(this.todayBirds);
    this.speciesCounts = grouped;
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

    this.isCompactLayout = window.innerWidth <= 768;
    const displayItems = this.isCompactLayout ? grouped.slice(0, 8) : grouped;

    this.plotData = [this.createTrace(displayItems)];
    this.chartAriaLabel = this.buildAriaLabel(grouped);
    this.initialisePlot();
    this.setPlotEvents();
  }

  private countSpecies(detections: BirdDetection[]): SpeciesCountItem[] {
    const grouped = detections.reduce((acc, detection) => {
      const current = acc.get(detection.Com_Name);
      acc.set(detection.Com_Name, {
        name: detection.Com_Name,
        sciName: detection.Sci_Name,
        count: (current?.count ?? 0) + 1
      });
      return acc;
    }, new Map<string, SpeciesCountItem>());

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  private createTrace(items: SpeciesCountItem[]): Plotly.Data {
    if (this.isCompactLayout) {
      return {
        type: 'bar',
        orientation: 'h',
        x: items.map(item => item.count),
        y: items.map(item => this.shortLabel(item.name, 22)),
        customdata: items.map(item => item.name),
        marker: {
          color: '#3b82f6'
        },
        hovertemplate: '%{customdata}: %{x} detections<extra></extra>'
      };
    }

    return {
      type: 'bar',
      x: items.map(item => this.shortLabel(item.name, 18)),
      y: items.map(item => item.count),
      customdata: items.map(item => item.name),
      marker: {
        color: '#3b82f6'
      },
      hovertemplate: '%{customdata}: %{y} detections<extra></extra>'
    };
  }

  private initialisePlot() {
    const plotHost = this.plotHost;
    if (!plotHost) {
      return;
    }

    const layout: Partial<Plotly.Layout> = this.isCompactLayout
      ? {
          showlegend: false,
          margin: { l: 126, r: 18, t: 8, b: 36 },
          xaxis: {
            fixedrange: true,
            tickfont: { size: 11 },
            title: { text: 'Detections' }
          },
          yaxis: {
            fixedrange: true,
            autorange: 'reversed',
            tickfont: { size: 11 },
            automargin: true
          }
        }
      : {
          showlegend: false,
          margin: { l: 52, r: 16, t: 8, b: 120 },
          xaxis: {
            fixedrange: true,
            tickangle: -28,
            tickfont: { size: 11 },
            automargin: true
          },
          yaxis: {
            fixedrange: true,
            tickfont: { size: 11 },
            title: { text: 'Detections' }
          }
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

    plotElement.on('plotly_hover', (data: any) => {
      if (!data.points?.length) {
        return;
      }

      const hoveredName = data.points[0].customdata as string;
      const hoveredItem = this.speciesCounts.find(item => item.name === hoveredName);
      if (!hoveredItem) {
        return;
      }

      const image: Partial<Plotly.Image> = {
        source: `birds/${this.toAssetName(hoveredItem.sciName)}.jpg`,
        x: 1,
        y: 1,
        sizex: 0.92,
        sizey: 0.92,
        xanchor: 'right',
        yanchor: 'top',
        xref: 'paper',
        yref: 'paper'
      };

      Plotly.relayout(this.plotHost!.nativeElement, { images: [image] });
    });

    plotElement.on('plotly_unhover', () => {
      Plotly.relayout(this.plotHost!.nativeElement, { images: [] });
    });

    this.plotEventsBound = true;
  }

  private buildSummary(items: SpeciesCountItem[]) {
    if (items.length === 0) {
      return [];
    }

    const topThree = items.slice(0, 3).map(item => `${item.name} (${item.count})`).join(', ');
    return [
      { label: 'Species', value: String(items.length) },
      { label: 'Top birds', value: topThree }
    ];
  }

  private buildAriaLabel(items: SpeciesCountItem[]) {
    const leaders = items.slice(0, 3).map(item => `${item.name} with ${item.count}`).join(', ');
    return `Daily species activity chart. ${items.length} species detected. Most active birds: ${leaders}.`;
  }

  private shortLabel(label: string, maxLength: number) {
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  }

  private toAssetName(value: string) {
    return value.replace(/ /g, '_');
  }
}
