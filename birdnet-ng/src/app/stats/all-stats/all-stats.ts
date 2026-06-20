import { Component } from '@angular/core';
import { Data } from '../../services/data';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-all-stats',
  imports: [DecimalPipe],
  templateUrl: './all-stats.html',
  styleUrl: './all-stats.css'
})
export class AllStats {
  stats: any;
  loading = true;
  errorMessage = '';

  constructor(
    private data: Data,
    private router: Router
  ) {}

  ngOnInit() {
    this.data.getStatsAll().subscribe({
      next: stats => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load all-time stats.';
      }
    });
  }

  showSpecies() {
    this.router.navigate(['/species']);
  }
}
