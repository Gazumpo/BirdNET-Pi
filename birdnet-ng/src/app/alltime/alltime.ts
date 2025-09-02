import { Component, Input } from '@angular/core';
import { Data } from '../services/data';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BirdSpecies } from '../models/bird-species';
import { AllStats } from "../stats/all-stats/all-stats";

@Component({
  selector: 'app-alltime',
  imports: [AllStats],
  templateUrl: './alltime.html',
  styleUrl: './alltime.css'
})
export class Alltime {

  constructor(
  ) {}

  ngOnInit() {
  }
}


