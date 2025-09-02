import { Routes } from '@angular/router';
import { Detections } from './detections/detections';
import { Species } from './species/species';
import { Daily } from './daily/daily'
import { Weekly } from './weekly/weekly';
import { SpeciesDetail } from './bird-components/species-detail/species-detail';
import { Alltime } from './alltime/alltime';

export const routes: Routes = [
    { path: '', redirectTo: '/detections', pathMatch: 'full' },
    { path: 'detections', component: Detections },
    { path: 'species', component: Species },
    { path: 'daily', component: Daily },
    { path: 'weekly', component: Weekly },
    { path: 'alltime', component: Alltime },
    { path: 'species-detail/:Sci_Name', component: SpeciesDetail }
];