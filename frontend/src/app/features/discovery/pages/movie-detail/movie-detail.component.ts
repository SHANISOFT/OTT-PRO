import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentService } from '../../services/content.service';
import { MovieDetails } from '../../models/content.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-page" *ngIf="movie; else loadingOrError">
      <div class="backdrop-hero" [style.backgroundImage]="'url(' + (movie.backdropPath || movie.posterPath) + ')'">
        <div class="backdrop-gradient"></div>
        <div class="hero-container">
          <div class="poster-box glass-panel">
            <img [src]="movie.posterPath" [alt]="movie.title" />
          </div>

          <div class="meta-box">
            <div class="badge-row">
              <span class="badge badge-gold">★ {{ movie.averageRating }} / 10</span>
              <span class="meta-tag">{{ movie.releaseDate?.substring(0, 4) }}</span>
              <span class="meta-tag">{{ movie.runtimeMinutes }} min</span>
              <span class="meta-tag">Movie</span>
            </div>

            <h1 class="title">{{ movie.title }}</h1>

            <div class="genres-row">
              <span *ngFor="let g of movie.genres" class="genre-pill">{{ g }}</span>
            </div>

            <p class="overview">{{ movie.overview }}</p>

            <div class="streaming-section" *ngIf="movie.platforms && movie.platforms.length > 0">
              <span class="streaming-label">Available on:</span>
              <div class="provider-badges">
                <a
                  *ngFor="let p of movie.platforms"
                  [href]="p.deepLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="provider-pill"
                >
                  <span>▶</span> {{ p.platform }}
                </a>
              </div>
            </div>

            <div class="action-buttons">
              <button (click)="onAddToWatchlist()" class="btn btn-primary">
                <span>➕</span> Add to Watchlist
              </button>
              <a [routerLink]="['/watch-parties']" class="btn btn-secondary">
                <span>🍿</span> Host Watch Party
              </a>
              <button (click)="onRate()" class="btn btn-outline">
                <span>⭐</span> Rate Movie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingOrError>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading movie details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-page { padding-bottom: 80px; }
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
    .meta-box { flex: 1; }
    .badge-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
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
    }
    .provider-badges { display: flex; gap: 8px; }
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
    .action-buttons { display: flex; gap: 12px; }
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
  `]
})
export class MovieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private contentService = inject(ContentService);
  private toast = inject(ToastService);

  movie: MovieDetails | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadMovie(slug);
      }
    });
  }

  private loadMovie(slug: string): void {
    this.contentService.getMovieBySlug(slug).subscribe({
      next: data => {
        this.movie = data;
      },
      error: () => {
        this.toast.error('Failed to load movie details.');
      }
    });
  }

  onAddToWatchlist(): void {
    this.toast.success(`"${this.movie?.title}" added to your Plan to Watch list!`);
  }

  onRate(): void {
    this.toast.info(`Rating recorded for "${this.movie?.title}"!`);
  }
}
