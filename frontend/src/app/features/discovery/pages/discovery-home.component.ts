import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../services/content.service';

interface MediaItem {
  id: string;
  slug?: string;
  title: string;
  type: 'Show' | 'Movie';
  poster: string;
  backdrop: string;
  rating: number;
  year: string;
  genres: string[];
  streamingPlatform: string;
}

@Component({
  selector: 'app-discovery-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="discovery-page">
      <div class="page-container">
        <!-- Genre Filter Bar -->
        <section class="genre-bar">
          <button
            *ngFor="let genre of genres"
            (click)="selectGenre(genre)"
            class="genre-chip"
            [class.active]="selectedGenre === genre"
          >
            {{ genre }}
          </button>
        </section>

        <!-- Trending Shows Section -->
        <section class="content-section">
          <div class="section-header">
            <div>
              <h2>Top Rated Shows & Movies</h2>
              <p class="section-subtitle">What global cinephiles and critics are currently bingeing</p>
            </div>
            <a routerLink="/watch-parties" class="see-all-link">Watch Parties Lobby →</a>
          </div>

          <div class="media-grid" *ngIf="filteredShows.length > 0; else noResults">
            <a
              *ngFor="let item of filteredShows"
              [routerLink]="['/' + (item.type === 'Show' ? 'shows' : 'movies'), item.slug || item.id]"
              class="media-card glass-panel"
            >
              <div class="poster-wrap">
                <img [src]="item.poster" [alt]="item.title" loading="lazy" />
                <div class="rating-badge">★ {{ item.rating }}</div>
                <div class="ott-tag">{{ item.streamingPlatform }}</div>
              </div>
              <div class="card-info">
                <div class="card-tags">
                  <span class="card-year">{{ item.year }}</span>
                  <span class="card-type">{{ item.type }}</span>
                </div>
                <h3 class="card-title">{{ item.title }}</h3>
                <div class="card-genres">
                  {{ item.genres.join(' • ') }}
                </div>
              </div>
            </a>
          </div>

          <ng-template #noResults>
            <div class="empty-state glass-panel">
              <div class="empty-icon-wrapper">
                <span class="empty-icon">🎬</span>
              </div>
              <h3 *ngIf="selectedGenre === 'All Genres'">No Titles Available</h3>
              <p *ngIf="selectedGenre === 'All Genres'" class="empty-desc">
                New shows and blockbuster movies will be available soon. In the meantime, you can join live watch parties or create a room with friends.
              </p>
              <h3 *ngIf="selectedGenre !== 'All Genres'">No titles found for "{{ selectedGenre }}"</h3>
              <p *ngIf="selectedGenre !== 'All Genres'" class="empty-desc">Try switching to another genre or view all titles.</p>

              <div class="empty-actions" *ngIf="selectedGenre === 'All Genres'">
                <a routerLink="/watch-parties" class="btn btn-primary">
                  <span>🍿</span> Explore Watch Parties
                </a>
              </div>
              <div class="empty-actions" *ngIf="selectedGenre !== 'All Genres'">
                <button (click)="selectGenre('All Genres')" class="btn btn-primary">
                  <span>←</span> View All Titles
                </button>
              </div>
            </div>
          </ng-template>
        </section>

        <!-- Community Live Watch Parties Preview -->
        <section class="watch-parties-banner">
          <div class="wp-banner-content">
            <span class="live-dot"></span>
            <div>
              <h3>Live Watch Parties Happening Now</h3>
              <p>Synchronize your watching with friends, join public rooms, vote in live polls, and chat.</p>
            </div>
          </div>
          <a routerLink="/watch-parties" class="btn btn-primary">Join Room</a>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .discovery-page {
      padding-bottom: 80px;
    }
    .genre-bar {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 30px 0 20px 0;
      scrollbar-width: none;
    }
    .genre-bar::-webkit-scrollbar {
      display: none;
    }
    .genre-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .genre-chip:hover {
      background: var(--bg-surface-elevated);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .genre-chip.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 0 16px rgba(229, 9, 20, 0.4);
    }
    .content-section {
      margin-top: 20px;
      margin-bottom: 50px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .section-header h2 {
      font-size: 1.8rem;
      font-weight: 800;
    }
    .section-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .see-all-link {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary);
      transition: color var(--transition-fast);
    }
    .see-all-link:hover {
      color: #ff333d;
      text-decoration: underline;
    }
    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 24px;
    }
    .media-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
      cursor: pointer;
    }
    .media-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .poster-wrap {
      position: relative;
      aspect-ratio: 2/3;
      overflow: hidden;
      background: #151922;
    }
    .poster-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-normal);
    }
    .media-card:hover .poster-wrap img {
      transform: scale(1.05);
    }
    .rating-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      color: #EAB308;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    .ott-tag {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(11, 14, 20, 0.85);
      backdrop-filter: blur(4px);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.7rem;
      font-weight: 700;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .card-info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-tags {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .card-type {
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: #ffffff;
      line-height: 1.3;
    }
    .card-genres {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: auto;
    }
    .empty-state {
      padding: 64px 32px;
      text-align: center;
      border-radius: var(--radius-xl);
      background: radial-gradient(circle at center top, rgba(229, 9, 20, 0.06) 0%, rgba(18, 24, 36, 0.6) 70%);
      border: 1px dashed rgba(255, 255, 255, 0.12);
      margin: 16px 0;
    }
    .empty-icon-wrapper {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px auto;
      border-radius: 50%;
      background: rgba(229, 9, 20, 0.1);
      border: 1px solid rgba(229, 9, 20, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(229, 9, 20, 0.2);
    }
    .empty-icon {
      font-size: 2.2rem;
    }
    .empty-state h3 {
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 8px;
      color: #ffffff;
    }
    .empty-desc {
      color: var(--text-secondary);
      max-width: 520px;
      margin: 0 auto 28px auto;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .empty-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .watch-parties-banner {
      border-radius: var(--radius-xl);
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      background: linear-gradient(135deg, rgba(229, 9, 20, 0.08) 0%, rgba(18, 24, 36, 0.95) 100%);
      border: 1px solid rgba(229, 9, 20, 0.25);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }
    .wp-banner-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .live-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 12px var(--primary);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
    .wp-banner-content h3 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .wp-banner-content p {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
  `]
})
export class DiscoveryHomeComponent implements OnInit {
  private contentService = inject(ContentService);

  genres = ['All Genres', 'Sci-Fi', 'Drama', 'Action', 'Thriller', 'Comedy', 'Mystery', 'Crime', 'Biography'];
  selectedGenre = 'All Genres';

  featuredShows: MediaItem[] = [];

  get filteredShows(): MediaItem[] {
    if (!this.selectedGenre || this.selectedGenre === 'All Genres') {
      return this.featuredShows;
    }
    return this.featuredShows.filter(item =>
      item.genres && item.genres.some(g => g.toLowerCase() === this.selectedGenre.toLowerCase())
    );
  }

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.contentService.getTrending().subscribe({
      next: data => {
        if (data) {
          const apiItems: MediaItem[] = [];

          if (data.trendingShows && data.trendingShows.length > 0) {
            apiItems.push(...data.trendingShows.map(s => ({
              id: s.id,
              slug: s.slug,
              title: s.title,
              type: 'Show' as const,
              poster: s.posterPath || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
              backdrop: s.backdropPath || '',
              rating: s.averageRating,
              year: s.releaseDate ? s.releaseDate.substring(0, 4) : '2024',
              genres: s.genres || [],
              streamingPlatform: s.streamingPlatforms?.[0] || 'OTT'
            })));
          }

          if (data.popularMovies && data.popularMovies.length > 0) {
            apiItems.push(...data.popularMovies.map(m => ({
              id: m.id,
              slug: m.slug,
              title: m.title,
              type: 'Movie' as const,
              poster: m.posterPath || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
              backdrop: m.backdropPath || '',
              rating: m.averageRating,
              year: m.releaseDate ? m.releaseDate.substring(0, 4) : '2024',
              genres: m.genres || [],
              streamingPlatform: m.streamingPlatforms?.[0] || 'OTT'
            })));
          }

          this.featuredShows = apiItems;
        } else {
          this.featuredShows = [];
        }
      },
      error: () => {
        this.featuredShows = [];
      }
    });
  }

  selectGenre(genre: string): void {
    this.selectedGenre = genre;
  }
}
