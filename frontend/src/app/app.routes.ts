import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'discovery',
    pathMatch: 'full'
  },
  {
    path: 'discovery',
    loadComponent: () => import('./features/discovery/pages/discovery-home.component').then(m => m.DiscoveryHomeComponent)
  },
  {
    path: 'shows/:slug',
    loadComponent: () => import('./features/discovery/pages/show-detail/show-detail.component').then(m => m.ShowDetailComponent)
  },
  {
    path: 'movies/:slug',
    loadComponent: () => import('./features/discovery/pages/movie-detail/movie-detail.component').then(m => m.MovieDetailComponent)
  },
  {
    path: 'watch-parties',
    loadComponent: () => import('./features/watch-parties/pages/party-lobby/party-lobby.component').then(m => m.PartyLobbyComponent)
  },
  {
    path: 'watch-parties/:roomCode',
    loadComponent: () => import('./features/watch-parties/pages/party-room/party-room.component').then(m => m.PartyRoomComponent)
  },
  {
    path: 'polls',
    loadComponent: () => import('./features/polls/pages/polls.component').then(m => m.PollsComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/user-profile/pages/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/user-profile/pages/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'messages',
    loadComponent: () => import('./features/messages/pages/messages.component').then(m => m.MessagesComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'shows',
    redirectTo: 'discovery'
  },
  {
    path: 'movies',
    redirectTo: 'discovery'
  },
  {
    path: '**',
    redirectTo: 'discovery'
  }
];

