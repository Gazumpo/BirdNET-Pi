import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Data } from '../../services/data';
import { BirdSpecies } from '../../models/bird-species';
import { BirdDetection } from '../../models/bird-detection.model';
import { DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { Wikipedia } from '../../services/wikipedia';
import { WikipediaTextPipe } from '../../pipes/wikipedia-text-pipe';
import { BarSpecies } from '../../plots/bar-species/bar-species';

@Component({
  selector: 'app-species-detail',
  imports: [DecimalPipe, PercentPipe, DatePipe, WikipediaTextPipe, BarSpecies],
  templateUrl: './species-detail.html',
  styleUrl: './species-detail.css'
})
export class SpeciesDetail {
  bird!: BirdSpecies
  latest!: BirdDetection[]
  best!: BirdDetection
  birdDescription: string | null = null;
  wikiUrl: string | null = null;
  searched: boolean  = true;
  atlasDescription: any;


  constructor(
    private route: ActivatedRoute, 
    private Wikipedia: Wikipedia,
    private Data: Data
  ) {}

  ngOnInit() {
    const Sci_Name = String(this.route.snapshot.paramMap.get('Sci_Name'));

    this.Data.getBird(Sci_Name).subscribe(bird => {
      this.bird = bird;
      console.log(bird)
      this.getLatest(bird.Sci_Name)
      this.getBest(bird.Sci_Name)
      this.getWiki(bird.Com_Name)
      this.getWikiUrl(bird.Com_Name)
    })
  }

  getLatest(Sci_Name: string) {
    this.Data.getLatest(3, Sci_Name).subscribe(latestBirds => this.latest = latestBirds);
  }

  getBest(Sci_Name: string) {
    this.Data.getBest(Sci_Name).subscribe(best => this.best = best);
  }

  getWiki(Com_Name: string) {
    this.Wikipedia.getBirdDescription(Com_Name).subscribe({
      next: (description: string | null) => {
        this.birdDescription = description;
        if (!description) {
          console.log('No description found for bird.')
        }
      },
      error: (err: any) => {
        console.error('Component error:', err);
      }
    });
  }
  getWikiUrl(Com_Name: string) {
    this.Wikipedia.getBirdUrl(Com_Name).subscribe({
      next: (url: string | null) => {
        this.wikiUrl = url;
        if (!url) {
          console.log('No urls found for bird.')
        }
      },
      error: (err: any) => {
        console.error('Component error:', err);
      }
    });
  }


}
