import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <a routerLink="/" class="brand-logo">
          <span class="logo-accent">OTT</span>PRO
          <span class="logo-tag">CINEMA</span>
        </a>

        <!-- Main Nav Links -->
        <nav class="nav-links">
          <a routerLink="/discovery" routerLinkActive="active" class="nav-link">
            <span class="icon">✨</span> Discover
          </a>
          <a routerLink="/watch-parties" routerLinkActive="active" class="nav-link">
            <span class="icon">🍿</span> Watch Parties
          </a>
          <a routerLink="/polls" routerLinkActive="active" class="nav-link">
            <span class="icon">🗳️</span> Live Polls
          </a>
          <a routerLink="/messages" routerLinkActive="active" class="nav-link" *ngIf="authService.currentUser$ | async">
            <span class="icon">💬</span> Messages
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-link admin-nav-link" *ngIf="authService.isAdmin$ | async">
            <span class="icon">🛡️</span> Admin Panel
          </a>
        </nav>

        <!-- Right Side Auth / User Actions -->
        <div class="nav-actions">
          <ng-container *ngIf="authService.currentUser$ | async as user; else guestActions">
            <div class="user-menu">
              <a [routerLink]="['/profile', user.username]" class="user-pill" title="My Profile">
                <div class="avatar-circle">
                  <img *ngIf="user.avatarUrl; else initials" [src]="user.avatarUrl" [alt]="user.username" />
                  <ng-template #initials>
                    <span>{{ user.username.charAt(0).toUpperCase() }}</span>
                  </ng-template>
                </div>
                <span class="username">{{ user.username }}</span>
              </a>
              <button (click)="authService.logout()" class="logout-btn" title="Sign Out">
                🚪
              </button>
            </div>
          </ng-container>

          <ng-template #guestActions>
            <div class="guest-buttons">
              <a routerLink="/auth/login" class="btn btn-outline btn-sm">Sign In</a>
              <a routerLink="/auth/register" class="btn btn-primary btn-sm">Join Free</a>
            </div>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(11, 14, 20, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      height: 70px;
      display: flex;
      align-items: center;
      transition: all var(--transition-normal);
    }
    .nav-container {
      width: 100%;
      max-width: 1380px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand-logo {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logo-accent {
      color: var(--primary);
    }
    .logo-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      background: rgba(229, 9, 20, 0.2);
      border: 1px solid rgba(229, 9, 20, 0.4);
      color: #ff4d52;
      border-radius: var(--radius-sm);
      letter-spacing: 0.08em;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .nav-link:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-link.active {
      color: #ffffff;
      background: rgba(229, 9, 20, 0.15);
      border: 1px solid rgba(229, 9, 20, 0.3);
    }
    .admin-nav-link {
      color: #ff4d52 !important;
      background: rgba(229, 9, 20, 0.12) !important;
      border: 1px solid rgba(229, 9, 20, 0.3) !important;
      font-weight: 700;
      animation: subtleGlow 3s infinite;
    }
    .admin-nav-link:hover, .admin-nav-link.active {
      background: rgba(229, 9, 20, 0.25) !important;
      border-color: #e50914 !important;
      color: #ffffff !important;
    }
    @keyframes subtleGlow {
      0%, 100% { box-shadow: 0 0 0px rgba(229, 9, 20, 0); }
      50% { box-shadow: 0 0 10px rgba(229, 9, 20, 0.3); }
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .watchlist-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      transition: all var(--transition-fast);
    }
    .watchlist-btn:hover, .watchlist-btn.active {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 12px 4px 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 600;
      transition: border-color var(--transition-fast);
    }
    .user-pill:hover {
      border-color: var(--primary);
    }
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary), var(--accent-indigo));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #ffffff;
      overflow: hidden;
    }
    .avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .logout-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .logout-btn:hover {
      background: rgba(244, 63, 94, 0.2);
      border-color: rgba(244, 63, 94, 0.4);
    }
    .guest-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-sm {
      padding: 8px 14px;
      font-size: 0.85rem;
    }
    @media (max-width: 900px) {
      .nav-links { display: none; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
}
