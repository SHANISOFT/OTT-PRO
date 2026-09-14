import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentService } from '../../services/content.service';
import { ShowDetails, Season } from '../../models/content.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-show-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-page" *ngIf="show; else loadingOrError">
      <!-- Backdrop Banner -->
      <div class="backdrop-hero" [style.backgroundImage]="'url(' + (show.backdropPath || show.posterPath) + ')'">
        <div class="backdrop-gradient"></div>
        <div class="hero-container">
          <div class="poster-box glass-panel">
            <img [src]="show.posterPath" [alt]="show.title" />
          </div>

          <div class="meta-box">
            <div class="badge-row">
              <span class="badge badge-gold">★ {{ show.averageRating }} / 10</span>
              <span class="meta-tag">{{ show.releaseDate?.substring(0, 4) }}</span>
              <span class="meta-tag">{{ show.status }}</span>
              <span class="meta-tag">{{ show.totalSeasons }} Seasons</span>
              <span class="meta-tag">{{ show.totalEpisodes }} Episodes</span>
            </div>

            <h1 class="title">{{ show.title }}</h1>

            <div class="genres-row">
              <span *ngFor="let g of show.genres" class="genre-pill">{{ g }}</span>
            </div>

            <p class="overview">{{ show.overview }}</p>

            <!-- Streaming Provider Links -->
            <div class="streaming-section" *ngIf="show.platforms && show.platforms.length > 0">
              <span class="streaming-label">Stream on:</span>
              <div class="provider-badges">
                <a
                  *ngFor="let p of show.platforms"
                  [href]="p.deepLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="provider-pill"
                >
                  <span>▶</span> {{ p.platform }}
                </a>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button (click)="onAddToWatchlist()" class="btn btn-primary">
                <span>➕</span> Add to Watchlist
              </button>
              <a [routerLink]="['/watch-parties']" class="btn btn-secondary">
                <span>🍿</span> Host Watch Party
              </a>
              <button (click)="onRate()" class="btn btn-outline">
                <span>⭐</span> Rate Show
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="content-container">
        <section class="seasons-section">
          <div class="section-title-row">
            <h2>Season & Episode Guide</h2>
            <div class="season-tabs">
              <button
                *ngFor="let season of show.seasons"
                (click)="selectedSeason = season"
                class="season-tab-btn"
                [class.active]="selectedSeason?.seasonNumber === season.seasonNumber"
              >
                Season {{ season.seasonNumber }}
              </button>
            </div>
          </div>

          <!-- Episode Cards List -->
          <div class="episodes-list" *ngIf="selectedSeason">
            <div *ngFor="let ep of selectedSeason.episodes" class="episode-card glass-panel">
              <div class="episode-still">
                <img [src]="ep.stillPath || show.posterPath" [alt]="ep.title" loading="lazy" />
                <span class="ep-number">E{{ ep.episodeNumber }}</span>
              </div>
              <div class="episode-info">
                <div class="ep-top">
                  <h3 class="ep-title">{{ ep.episodeNumber }}. {{ ep.title }}</h3>
                  <span class="ep-rating">★ {{ ep.averageRating }}</span>
                </div>
                <div class="ep-meta">
                  <span>{{ ep.runtimeMinutes }}m</span>
                  <span>•</span>
                  <span>{{ ep.airDate }}</span>
                </div>
                <p class="ep-desc">{{ ep.overview }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <ng-template #loadingOrError>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading show details from OTT PRO...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-page {
      padding-bottom: 80px;
    }
    .backdrop-hero {
      position: relative;
      background-size: cover;
      background-position: center;
      min-height: 520px;
      display: flex;
      align-items: flex-end;
      padding: 60px 0 40px;
    }
    .backdrop-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(11, 14, 20, 0.4) 0%, rgba(11, 14, 20, 0.98) 100%),
                  linear-gradient(90deg, rgba(11, 14, 20, 0.95) 0%, rgba(11, 14, 20, 0.6) 60%);
    }
    .hero-container {
      position: relative;
      z-index: 10;
      max-width: 1380px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      gap: 36px;
      width: 100%;
      align-items: flex-end;
    }
    .poster-box {
      width: 250px;
      flex-shrink: 0;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .poster-box img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
    .meta-box {
      flex: 1;
    }
    .badge-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .meta-tag {
      font-size: 0.85rem;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.08);
      padding: 3px 10px;
      border-radius: var(--radius-sm);
    }
    .title {
      font-size: 3rem;
      margin-bottom: 12px;
      line-height: 1.1;
    }
    .genres-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .genre-pill {
      font-size: 0.8rem;
      font-weight: 600;
      color: #93c5fd;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .overview {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.6;
      max-width: 800px;
      margin-bottom: 20px;
    }
    .streaming-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .streaming-label {
      font-size: 0.88rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .provider-badges {
      display: flex;
      gap: 8px;
    }
    .provider-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffffff;
      background: rgba(229, 9, 20, 0.2);
      border: 1px solid rgba(229, 9, 20, 0.4);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .provider-pill:hover {
      background: var(--primary);
      box-shadow: 0 0 12px var(--primary-glow);
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .content-container {
      max-width: 1380px;
      margin: 40px auto 0;
      padding: 0 24px;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .season-tabs {
      display: flex;
      gap: 8px;
    }
    .season-tab-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .season-tab-btn:hover {
      color: #ffffff;
    }
    .season-tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    .episodes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .episode-card {
      display: flex;
      gap: 20px;
      padding: 16px;
      border-radius: var(--radius-lg);
    }
    .episode-still {
      position: relative;
      width: 180px;
      height: 105px;
      flex-shrink: 0;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-surface-elevated);
    }
    .episode-still img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ep-number {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(0, 0, 0, 0.7);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
    }
    .episode-info {
      flex: 1;
    }
    .ep-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .ep-title {
      font-size: 1.1rem;
    }
    .ep-rating {
      color: #fbbf24;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .ep-meta {
      display: flex;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .ep-desc {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(229, 9, 20, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 768px) {
      .hero-container {
        flex-direction: column;
        align-items: flex-start;
      }
      .poster-box { width: 160px; }
      .episode-card { flex-direction: column; }
      .episode-still { width: 100%; height: 180px; }
    }
  `]
})
export class ShowDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private contentService = inject(ContentService);
  private toast = inject(ToastService);

  show: ShowDetails | null = null;
  selectedSeason: Season | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadShow(slug);
      }
    });
  }

  private loadShow(slug: string): void {
    this.contentService.getShowBySlug(slug).subscribe({
      next: data => {
        this.show = data;
        if (data.seasons && data.seasons.length > 0) {
          this.selectedSeason = data.seasons[0];
        }
      },
      error: () => {
        this.toast.error('Failed to load show details.');
      }
    });
  }

  onAddToWatchlist(): void {
    this.toast.success(`"${this.show?.title}" added to your Plan to Watch list!`);
  }

  onRate(): void {
    this.toast.info('Rating modal will open for this title.');
  }
}
