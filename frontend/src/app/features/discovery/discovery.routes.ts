import { Routes } from '@angular/router';
import { DiscoveryHomeComponent } from './pages/discovery-home.component';
import { ShowDetailComponent } from './pages/show-detail/show-detail.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';

export const DISCOVERY_ROUTES: Routes = [
  { path: '', component: DiscoveryHomeComponent },
  { path: 'shows/:slug', component: ShowDetailComponent },
  { path: 'movies/:slug', component: MovieDetailComponent }
];
