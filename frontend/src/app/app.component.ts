import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="app-layout">
      <app-navbar></app-navbar>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <div class="footer-container">
          <div class="footer-brand">
            <span class="logo-accent">OTT</span>PRO
            <p>The next-generation social network for cinema & television enthusiasts worldwide.</p>
          </div>
          <div class="footer-links">
            <div class="link-group">
              <h4>Platform</h4>
              <a href="#">Trending Shows</a>
              <a href="#">Movies Catalog</a>
              <a href="#">Watch Parties</a>
              <a href="#">Social Feed</a>
            </div>
            <div class="link-group">
              <h4>Community</h4>
              <a href="#">Guidelines</a>
              <a href="#">Discussions</a>
              <a href="#">Polls & Trivia</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 OTT PRO. All rights reserved. Content metadata & platform availability for informational purposes.</p>
        </div>
      </footer>

      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
    }
    .app-footer {
      background: var(--bg-darkest);
      border-top: 1px solid var(--border-subtle);
      padding: 48px 24px 24px;
      margin-top: auto;
    }
    .footer-container {
      max-width: 1380px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 40px;
      flex-wrap: wrap;
      margin-bottom: 36px;
    }
    .footer-brand {
      max-width: 380px;
    }
    .footer-brand span {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 900;
    }
    .logo-accent {
      color: var(--primary);
    }
    .footer-brand p {
      margin-top: 10px;
      color: var(--text-secondary);
      font-size: 0.88rem;
      line-height: 1.6;
    }
    .footer-links {
      display: flex;
      gap: 60px;
    }
    .link-group h4 {
      font-size: 0.95rem;
      margin-bottom: 12px;
      color: #ffffff;
    }
    .link-group a {
      display: block;
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-bottom: 8px;
      transition: color var(--transition-fast);
    }
    .link-group a:hover {
      color: var(--primary);
    }
    .footer-bottom {
      max-width: 1380px;
      margin: 0 auto;
      padding-top: 24px;
      border-top: 1px solid var(--border-subtle);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  `]
})
export class AppComponent {
  title = 'OTT PRO';
}
