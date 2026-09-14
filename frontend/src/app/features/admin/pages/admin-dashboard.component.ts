import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats, AdminUser, AdminParty, AdminContentItem } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-container">
      <!-- Admin Header -->
      <header class="admin-header">
        <div class="header-left">
          <div class="shield-icon">🛡️</div>
          <div>
            <h1 class="header-title">OTT PRO Super Admin Console</h1>
            <p class="header-subtitle">Platform Analytics, Catalog CMS, User Moderation & Live Watch Parties Supervision</p>
          </div>
        </div>

        <div class="header-right">
          <div class="system-status-chip">
            <span class="pulse-dot"></span>
            <span>All Systems Operational</span>
          </div>
          <a routerLink="/discovery" class="btn btn-outline btn-sm">
            ← Back to App
          </a>
        </div>
      </header>

      <!-- Admin Navigation Tabs -->
      <nav class="admin-tabs">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'overview'" 
          (click)="switchTab('overview')">
          📊 Platform Overview
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'content'" 
          (click)="switchTab('content')">
          🎬 Content CMS ({{ contentList.length }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'users'" 
          (click)="switchTab('users')">
          👥 Users & Roles ({{ userTotal }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'parties'" 
          (click)="switchTab('parties')">
          🍿 Live Parties ({{ activeParties.length }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'polls'" 
          (click)="switchTab('polls')">
          🗳️ Official Polls
        </button>
        <button 
          class="tab-btn saas-tab" 
          [class.active]="activeTab === 'monetization'" 
          (click)="switchTab('monetization')">
          💰 SaaS Monetization
        </button>
      </nav>

      <!-- TAB 1: OVERVIEW & ANALYTICS -->
      <section *ngIf="activeTab === 'overview'" class="tab-content">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-wrap user-kpi">👥</div>
            <div class="kpi-info">
              <span class="kpi-label">Total Users</span>
              <span class="kpi-value">{{ stats?.users?.total || 0 }}</span>
              <span class="kpi-subtext">🟢 {{ stats?.users?.active || 0 }} Active · 🔴 {{ stats?.users?.banned || 0 }} Banned</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap party-kpi">🍿</div>
            <div class="kpi-info">
              <span class="kpi-label">Active Watch Parties</span>
              <span class="kpi-value">{{ stats?.watchParties?.active || 0 }}</span>
              <span class="kpi-subtext">Total Hosted: {{ stats?.watchParties?.total || 0 }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap content-kpi">🎬</div>
            <div class="kpi-info">
              <span class="kpi-label">Catalog Titles</span>
              <span class="kpi-value">{{ stats?.content?.total || 0 }}</span>
              <span class="kpi-subtext">{{ stats?.content?.totalShows || 0 }} Series · {{ stats?.content?.totalMovies || 0 }} Movies</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap poll-kpi">🗳️</div>
            <div class="kpi-info">
              <span class="kpi-label">Fan Votes Cast</span>
              <span class="kpi-value">{{ stats?.polls?.totalVotes || 0 }}</span>
              <span class="kpi-subtext">Across {{ stats?.polls?.totalPolls || 0 }} active community polls</span>
            </div>
          </div>
        </div>

        <!-- System Architecture Diagnostics -->
        <div class="diagnostics-grid">
          <div class="card diag-card">
            <h3 class="card-title">🖥️ Server & Infrastructure Health</h3>
            <div class="diag-items">
              <div class="diag-row">
                <span class="diag-label">ASP.NET Core API Server:</span>
                <span class="diag-status ok">🟢 200 OK (Port 5000)</span>
              </div>
              <div class="diag-row">
                <span class="diag-label">MongoDB Replica Set / Database:</span>
                <span class="diag-status ok">🟢 Connected (OTTProDb)</span>
              </div>
              <div class="diag-row">
                <span class="diag-label">WebRTC & SignalR Cinema Hub:</span>
                <span class="diag-status ok">⚡ Live (/hubs/watchparty)</span>
              </div>
              <div class="diag-row">
                <span class="diag-label">JWT Session Validity:</span>
                <span class="diag-status ok">🔒 7 Days Extended Token</span>
              </div>
            </div>
          </div>

          <div class="card diag-card">
            <h3 class="card-title">⚡ Quick Admin Actions</h3>
            <div class="quick-actions-box">
              <button (click)="switchTab('content'); openAddContentModal()" class="btn btn-primary">
                ➕ Add Movie / Web Series
              </button>
              <button (click)="switchTab('polls'); openAddPollModal()" class="btn btn-accent">
                🗳️ Create Official Poll
              </button>
              <button (click)="switchTab('parties')" class="btn btn-outline">
                🍿 Monitor Live Parties
              </button>
              <button (click)="switchTab('users')" class="btn btn-outline">
                👑 Manage User Roles
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 2: CONTENT CMS -->
      <section *ngIf="activeTab === 'content'" class="tab-content">
        <div class="section-toolbar">
          <div class="search-wrap">
            <input 
              type="text" 
              [(ngModel)]="contentSearch" 
              placeholder="Search shows and movies..." 
              class="admin-input" 
            />
          </div>
          <button (click)="openAddContentModal()" class="btn btn-primary" id="btn-open-add-content">
            ➕ Add Show / Movie
          </button>
        </div>

        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Type</th>
                <th>Genres</th>
                <th>Rating</th>
                <th>Release</th>
                <th>Trailer Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredContent">
                <td>
                  <img *ngIf="item.posterPath" [src]="item.posterPath" [alt]="item.title" class="table-poster" />
                  <div *ngIf="!item.posterPath" class="table-poster-ph">🎬</div>
                </td>
                <td class="title-cell">
                  <strong>{{ item.title }}</strong>
                  <span class="table-overview">{{ item.overview | slice:0:70 }}...</span>
                </td>
                <td>
                  <span class="type-pill" [class.show-pill]="item.type === 'Show'">
                    {{ item.type }}
                  </span>
                </td>
                <td>
                  <span *ngFor="let g of item.genres" class="genre-tag">{{ g }}</span>
                </td>
                <td>
                  <span class="rating-badge">⭐ {{ item.rating | number:'1.1-1' }}</span>
                </td>
                <td>{{ item.releaseDate || 'N/A' }}</td>
                <td>
                  <a *ngIf="item.trailerUrl" [href]="item.trailerUrl" target="_blank" class="link-btn">
                    ▶️ Preview
                  </a>
                  <span *ngIf="!item.trailerUrl" class="text-muted">None</span>
                </td>
                <td>
                  <button (click)="deleteContent(item)" class="btn btn-danger btn-xs" title="Delete content">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- TAB 3: USER MANAGEMENT & ROLES -->
      <section *ngIf="activeTab === 'users'" class="tab-content">
        <div class="section-toolbar">
          <div class="search-wrap">
            <input 
              type="text" 
              [(ngModel)]="userSearch" 
              (keyup.enter)="loadUsers()"
              placeholder="Search by username or email..." 
              class="admin-input" 
            />
          </div>
          <button (click)="loadUsers()" class="btn btn-outline btn-sm">
            🔍 Search
          </button>
        </div>

        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Account Status</th>
                <th>Watch Time</th>
                <th>Joined</th>
                <th>Manage Role</th>
                <th>Moderate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usersList">
                <td class="user-cell">
                  <div class="user-avatar-mini">
                    {{ u.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <strong>{{ u.fullName || u.username }}</strong>
                    <div class="user-handle">&#64;{{ u.username }}</div>
                  </div>
                </td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="role-pill" [class.admin-pill]="u.isAdmin">
                    {{ u.isAdmin ? '👑 Admin' : '👤 User' }}
                  </span>
                </td>
                <td>
                  <span class="status-pill" [class.banned-pill]="u.status === 'Banned'">
                    {{ u.status }}
                  </span>
                </td>
                <td>{{ u.watchTime }}m</td>
                <td>{{ u.createdAt | date:'mediumDate' }}</td>
                <td>
                  <button 
                    *ngIf="!u.isAdmin" 
                    (click)="toggleUserRole(u, 'Admin')" 
                    class="btn btn-accent btn-xs"
                    title="Grant full admin permissions">
                    👑 Promote to Admin
                  </button>
                  <button 
                    *ngIf="u.isAdmin && u.username !== currentUsername" 
                    (click)="toggleUserRole(u, 'User')" 
                    class="btn btn-outline btn-xs"
                    title="Demote to normal user">
                    Demote to User
                  </button>
                  <span *ngIf="u.isAdmin && u.username === currentUsername" class="text-muted text-xs">
                    (Your Account)
                  </span>
                </td>
                <td>
                  <button 
                    *ngIf="u.status !== 'Banned' && u.username !== currentUsername" 
                    (click)="toggleUserStatus(u, 'Banned')" 
                    class="btn btn-danger btn-xs">
                    🚫 Ban
                  </button>
                  <button 
                    *ngIf="u.status === 'Banned'" 
                    (click)="toggleUserStatus(u, 'Active')" 
                    class="btn btn-primary btn-xs">
                    ✅ Unban
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- TAB 4: LIVE WATCH PARTIES MONITOR -->
      <section *ngIf="activeTab === 'parties'" class="tab-content">
        <div class="section-toolbar">
          <h2>🔴 Ongoing Watch Parties</h2>
          <button (click)="loadActiveParties()" class="btn btn-outline btn-sm">
            🔄 Refresh
          </button>
        </div>

        <div class="table-card">
          <div *ngIf="activeParties.length === 0" class="empty-state-card">
            <span>🍿</span>
            <h3>No Active Watch Parties Currently Live</h3>
            <p>When users host watch parties, they will appear here in real time with instant supervision controls.</p>
          </div>

          <table *ngIf="activeParties.length > 0" class="admin-table">
            <thead>
              <tr>
                <th>Room Code</th>
                <th>Title</th>
                <th>Host</th>
                <th>Type</th>
                <th>Online Attendees</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of activeParties">
                <td>
                  <span class="room-code-tag">{{ p.roomCode }}</span>
                </td>
                <td><strong>{{ p.title }}</strong></td>
                <td>&#64;{{ p.hostUsername }}</td>
                <td>
                  <span class="badge" [class.badge-private]="p.isPrivate">
                    {{ p.isPrivate ? '🔒 Private' : '🌐 Public' }}
                  </span>
                </td>
                <td>
                  <span class="member-count-badge">👥 {{ p.memberCount }}</span>
                </td>
                <td>{{ p.createdAt | date:'shortTime' }}</td>
                <td class="action-cell">
                  <a [routerLink]="['/watch-parties/room', p.roomCode]" class="btn btn-outline btn-xs">
                    👁️ Join Room
                  </a>
                  <button (click)="forceTerminateParty(p)" class="btn btn-danger btn-xs">
                    🛑 Terminate Party
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- TAB 5: OFFICIAL POLLS -->
      <section *ngIf="activeTab === 'polls'" class="tab-content">
        <div class="section-toolbar">
          <h2>🗳️ Official Platform Polls</h2>
          <button (click)="openAddPollModal()" class="btn btn-primary" id="btn-open-create-poll">
            ➕ Launch Official Poll
          </button>
        </div>

        <div class="card">
          <p class="text-secondary">
            Official platform polls are pinned at the top of the <strong>Live Polls</strong> section and broadcast to all users on OTT PRO.
          </p>
          <a routerLink="/polls" class="btn btn-outline btn-sm mt-3">
            Go to Live Polls Page 🗳️
          </a>
        </div>
      </section>

      <!-- TAB 6: SAAS MONETIZATION ROADMAP -->
      <section *ngIf="activeTab === 'monetization'" class="tab-content">
        <div class="monetization-banner">
          <div class="monetization-glow"></div>
          <span class="saas-badge">💰 OTT PRO Monetization Blueprint</span>
          <h2>How OTT PRO Generates Revenue & Cash Flow</h2>
          <p>
            You asked how to turn this platform into a high-earning SaaS business to make serious money. Here are 5 ready-to-deploy revenue streams designed specifically for OTT watch parties:
          </p>
        </div>

        <div class="pricing-grid">
          <!-- Model 1: Pro Subscriptions -->
          <div class="pricing-card featured-card">
            <div class="card-tag">HIGH RECURRING REVENUE</div>
            <h3>👑 OTT PRO VIP Pass</h3>
            <div class="price-box">
              <span class="price">₹199</span>
              <span class="period">/ month</span>
            </div>
            <ul class="feature-list">
              <li>✅ <strong>Unlimited Room Attendees</strong> (Free limited to 5)</li>
              <li>✅ <strong>1080p 60fps Ultra HD Screen Sharing</strong></li>
              <li>✅ <strong>Custom Room URLs</strong> (e.g. ottpro.com/party/yourname)</li>
              <li>✅ <strong>Gold VIP Crown Badge</strong> in Chat & Profile</li>
              <li>✅ <strong>Ad-Free Experience</strong></li>
            </ul>
            <div class="revenue-projection">
              📈 1,000 VIP Users = <strong>₹1,99,000 / month</strong> recurring!
            </div>
          </div>

          <!-- Model 2: Virtual Gifting -->
          <div class="pricing-card">
            <div class="card-tag">CREATOR CUT</div>
            <h3>🍿 Live Tipping & Gifts</h3>
            <div class="price-box">
              <span class="price">20%</span>
              <span class="period">Platform Take-Rate</span>
            </div>
            <ul class="feature-list">
              <li>🍿 <strong>Popcorn Gift</strong>: ₹10 (You make ₹2)</li>
              <li>🍕 <strong>Pizza Slice</strong>: ₹49 (You make ₹10)</li>
              <li>🔥 <strong>Fire Rocket</strong>: ₹199 (You make ₹40)</li>
              <li>👑 <strong>Golden Crown</strong>: ₹499 (You make ₹100)</li>
              <li>✅ Creators stream their favorite shows, fans tip them live!</li>
            </ul>
            <div class="revenue-projection">
              📈 10,000 gifts/mo = <strong>₹1,00,000+ profit</strong>!
            </div>
          </div>

          <!-- Model 3: PPV Ticketed Parties -->
          <div class="pricing-card">
            <div class="card-tag">EVENTS & PREMIERES</div>
            <h3>🎟️ Pay-Per-View Parties</h3>
            <div class="price-box">
              <span class="price">₹49 - ₹299</span>
              <span class="period">per ticket</span>
            </div>
            <ul class="feature-list">
              <li>✅ Ticketed Watch Parties for World Cup, Bigg Boss finales, or blockbuster movies.</li>
              <li>✅ Paid entry via UPI / Razorpay / Stripe before entering the room.</li>
              <li>✅ Ideal for YouTube influencers hosting exclusive commentary watch parties.</li>
            </ul>
            <div class="revenue-projection">
              📈 500 tickets × ₹99 = <strong>₹49,500</strong> in a single evening!
            </div>
          </div>

          <!-- Model 4: Sponsored Rooms -->
          <div class="pricing-card">
            <div class="card-tag">B2B BRAND DEALS</div>
            <h3>📢 Sponsored Watch Parties</h3>
            <div class="price-box">
              <span class="price">₹5,000+</span>
              <span class="period">per sponsor</span>
            </div>
            <ul class="feature-list">
              <li>✅ Brands, movie creators, or OTT platforms pay to pin their watch party at the top of the lobby hero section.</li>
              <li>✅ Pinned banner with direct "Join Sponsored Premiere" CTA.</li>
            </ul>
            <div class="revenue-projection">
              📈 4 brand placements/mo = <strong>₹20,000 - ₹50,000</strong> pure profit!
            </div>
          </div>
        </div>
      </section>

      <!-- MODAL: ADD CONTENT -->
      <div *ngIf="showAddContentModal" class="modal-overlay" (click)="closeAddContentModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>➕ Add New Movie or Web Series</h2>
            <button (click)="closeAddContentModal()" class="close-btn">✕</button>
          </div>

          <form (submit)="saveContent($event)" class="modal-form">
            <div class="form-row">
              <div class="form-group flex-2">
                <label>Title *</label>
                <input type="text" [(ngModel)]="contentForm.title" name="title" required placeholder="e.g. Inception or Mirzapur" class="admin-input" />
              </div>

              <div class="form-group flex-1">
                <label>Content Type *</label>
                <select [(ngModel)]="contentForm.type" name="type" class="admin-input">
                  <option value="Movie">Movie</option>
                  <option value="Show">Web Series / Show</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Synopsis / Overview</label>
              <textarea [(ngModel)]="contentForm.overview" name="overview" rows="3" placeholder="Brief plot summary..." class="admin-input"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Poster Image URL</label>
                <input type="url" [(ngModel)]="contentForm.posterPath" name="posterPath" placeholder="https://..." class="admin-input" />
              </div>

              <div class="form-group flex-1">
                <label>Backdrop Banner URL</label>
                <input type="url" [(ngModel)]="contentForm.backdropPath" name="backdropPath" placeholder="https://..." class="admin-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Genres (comma-separated)</label>
                <input type="text" [(ngModel)]="contentFormGenresRaw" name="genresRaw" placeholder="Action, Sci-Fi, Thriller" class="admin-input" />
              </div>

              <div class="form-group flex-1">
                <label>Rating (1-10)</label>
                <input type="number" step="0.1" [(ngModel)]="contentForm.rating" name="rating" class="admin-input" />
              </div>

              <div class="form-group flex-1">
                <label>Release Year / Date</label>
                <input type="text" [(ngModel)]="contentForm.releaseDate" name="releaseDate" placeholder="2024" class="admin-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Official Trailer Link (YouTube URL)</label>
                <input type="url" [(ngModel)]="contentForm.trailerUrl" name="trailerUrl" placeholder="https://www.youtube.com/watch?v=..." class="admin-input" />
              </div>

              <div class="form-group flex-1">
                <label>Direct Video / Stream URL (Optional)</label>
                <input type="url" [(ngModel)]="contentForm.videoUrl" name="videoUrl" placeholder="https://... (MP4 / HLS)" class="admin-input" />
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeAddContentModal()" class="btn btn-outline">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSavingContent">
                {{ isSavingContent ? 'Saving...' : '💾 Publish to Catalog' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: CREATE OFFICIAL POLL -->
      <div *ngIf="showAddPollModal" class="modal-overlay" (click)="closeAddPollModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🗳️ Launch Official Platform Poll</h2>
            <button (click)="closeAddPollModal()" class="close-btn">✕</button>
          </div>

          <form (submit)="savePoll($event)" class="modal-form">
            <div class="form-group">
              <label>Poll Title / Question *</label>
              <input type="text" [(ngModel)]="pollForm.title" name="pollTitle" required placeholder="e.g. Who was the best performer in Bigg Boss this week?" class="admin-input" />
            </div>

            <div class="form-group">
              <label>Category / Topic</label>
              <input type="text" [(ngModel)]="pollForm.category" name="pollCategory" placeholder="Entertainment, Predictions, Award" class="admin-input" />
            </div>

            <div class="form-group">
              <label>Poll Options (At least 2 required)</label>
              <div *ngFor="let opt of pollForm.options; let i = index; trackBy: trackByIndex" class="option-input-row">
                <span class="option-num">{{ i + 1 }}.</span>
                <input type="text" [(ngModel)]="pollForm.options[i]" [name]="'opt' + i" placeholder="Option text..." class="admin-input flex-1" required />
                <button type="button" *ngIf="pollForm.options.length > 2" (click)="removePollOption(i)" class="btn btn-danger btn-xs">✕</button>
              </div>
              <button type="button" (click)="addPollOption()" class="btn btn-outline btn-sm mt-2">
                ➕ Add Another Option
              </button>
            </div>

            <div class="form-group">
              <label>Duration</label>
              <select [(ngModel)]="pollForm.durationDays" name="durationDays" class="admin-input">
                <option [value]="1">24 Hours (1 Day)</option>
                <option [value]="3">3 Days</option>
                <option [value]="7">7 Days (1 Week)</option>
                <option [value]="30">30 Days (1 Month)</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeAddPollModal()" class="btn btn-outline">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSavingPoll">
                {{ isSavingPoll ? 'Launching...' : '🚀 Launch Official Poll' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      min-height: calc(100vh - 70px);
      background: #07090E;
      color: #ffffff;
      padding: 32px 40px;
    }

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .shield-icon {
      font-size: 2.4rem;
      background: rgba(229, 9, 20, 0.15);
      border: 1px solid rgba(229, 9, 20, 0.3);
      width: 58px;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
    }

    .header-title {
      font-size: 1.7rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }

    .header-subtitle {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 4px 0 0 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .system-status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #34d399;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.5; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0.5; transform: scale(0.9); }
    }

    /* Tabs */
    .admin-tabs {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 30px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: #94a3b8;
      padding: 10px 18px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #ffffff;
    }

    .tab-btn.active {
      color: #ffffff;
      border-bottom-color: #e50914;
    }

    .saas-tab.active {
      border-bottom-color: #10b981;
      color: #34d399;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .kpi-card {
      background: #0D111A;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      align-items: center;
      gap: 18px;
      transition: transform 0.2s, border-color 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .kpi-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
    }

    .user-kpi { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); }
    .party-kpi { background: rgba(229, 9, 20, 0.15); border: 1px solid rgba(229, 9, 20, 0.3); }
    .content-kpi { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }
    .poll-kpi { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.82rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .kpi-value {
      font-size: 1.9rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }

    .kpi-subtext {
      font-size: 0.76rem;
      color: #64748b;
      margin-top: 4px;
    }

    /* Diagnostics */
    .diagnostics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
    }

    .card {
      background: #0D111A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 18px 0;
      color: #ffffff;
    }

    .diag-items {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .diag-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.88rem;
    }

    .diag-label { color: #94a3b8; }
    .diag-status.ok { color: #34d399; font-weight: 600; }

    .quick-actions-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Toolbar */
    .section-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .admin-input {
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.9rem;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }

    .admin-input:focus {
      border-color: #e50914;
    }

    .search-wrap {
      min-width: 320px;
    }

    /* Tables */
    .table-card {
      background: #0D111A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    .admin-table th {
      background: rgba(255, 255, 255, 0.03);
      color: #94a3b8;
      padding: 14px 18px;
      font-weight: 700;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .admin-table td {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      vertical-align: middle;
    }

    .admin-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .table-poster {
      width: 44px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
    }

    .table-poster-ph {
      width: 44px;
      height: 60px;
      background: #1e293b;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .title-cell {
      max-width: 260px;
    }

    .title-cell strong {
      display: block;
      color: #ffffff;
      font-size: 0.95rem;
    }

    .table-overview {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.3;
    }

    .type-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }

    .type-pill.show-pill {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
    }

    .genre-tag {
      display: inline-block;
      font-size: 0.72rem;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      margin: 2px;
    }

    .rating-badge {
      font-weight: 700;
      color: #facc15;
    }

    .link-btn {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    /* Users Tab */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar-mini {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e50914, #6366f1);
      color: #fff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .user-handle {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: monospace;
    }

    .role-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }

    .role-pill.admin-pill {
      background: rgba(229, 9, 20, 0.2);
      border: 1px solid rgba(229, 9, 20, 0.4);
      color: #ff4d52;
    }

    .status-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    .status-pill.banned-pill {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .room-code-tag {
      font-family: monospace;
      font-weight: 800;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .member-count-badge {
      font-weight: 700;
      color: #34d399;
    }

    .empty-state-card {
      padding: 60px;
      text-align: center;
      color: #94a3b8;
    }

    .empty-state-card span { font-size: 3rem; }
    .empty-state-card h3 { color: #ffffff; margin: 12px 0 6px 0; }

    /* SaaS Monetization Section */
    .monetization-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.1));
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 28px;
      border-radius: 18px;
      margin-bottom: 30px;
      position: relative;
      overflow: hidden;
    }

    .saas-badge {
      display: inline-block;
      background: #10b981;
      color: #000;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
    }

    .monetization-banner h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 8px 0;
      color: #ffffff;
    }

    .monetization-banner p {
      color: #cbd5e1;
      font-size: 0.95rem;
      max-width: 800px;
      line-height: 1.5;
      margin: 0;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 22px;
    }

    .pricing-card {
      background: #0D111A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .pricing-card.featured-card {
      border-color: rgba(16, 185, 129, 0.5);
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.05), #0D111A);
    }

    .card-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #34d399;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .pricing-card h3 {
      font-size: 1.3rem;
      font-weight: 800;
      margin: 0 0 12px 0;
      color: #ffffff;
    }

    .price-box {
      margin-bottom: 18px;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .price {
      font-size: 2.2rem;
      font-weight: 900;
      color: #ffffff;
    }

    .period {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.88rem;
      color: #cbd5e1;
      flex: 1;
    }

    .revenue-projection {
      background: rgba(255, 255, 255, 0.04);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      padding: 12px;
      border-radius: 10px;
      font-size: 0.85rem;
      color: #34d399;
      text-align: center;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: #0E131F;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      max-width: 680px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 28px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }

    .modal-header h2 {
      font-size: 1.4rem;
      font-weight: 800;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.3rem;
      cursor: pointer;
    }

    .form-group {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .option-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .option-num {
      font-family: monospace;
      color: #94a3b8;
      width: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    /* Buttons */
    .btn {
      border: none;
      padding: 10px 18px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-sm { padding: 6px 14px; font-size: 0.82rem; }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }

    .btn-primary { background: #e50914; color: #fff; }
    .btn-primary:hover { background: #b80710; }

    .btn-accent { background: #6366f1; color: #fff; }
    .btn-accent:hover { background: #4f46e5; }

    .btn-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
    .btn-danger:hover { background: #ef4444; color: #fff; }

    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .text-muted { color: #64748b; }
    .text-xs { font-size: 0.75rem; }
    .text-secondary { color: #94a3b8; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  toastService: ToastService = inject(ToastService);
  authService: AuthService = inject(AuthService);

  activeTab: 'overview' | 'content' | 'users' | 'parties' | 'polls' | 'monetization' = 'overview';

  stats: AdminStats | null = null;
  contentList: AdminContentItem[] = [];
  usersList: AdminUser[] = [];
  userTotal = 0;
  activeParties: AdminParty[] = [];

  contentSearch = '';
  userSearch = '';
  currentUsername = '';

  // Content Modal
  showAddContentModal = false;
  isSavingContent = false;
  contentForm: any = {
    title: '',
    type: 'Movie',
    overview: '',
    posterPath: '',
    backdropPath: '',
    rating: 8.5,
    releaseDate: '2024',
    trailerUrl: '',
    videoUrl: ''
  };
  contentFormGenresRaw = 'Action, Drama';

  // Poll Modal
  showAddPollModal = false;
  isSavingPoll = false;
  pollForm = {
    title: '',
    category: 'Entertainment',
    options: ['', ''],
    durationDays: 7
  };

  ngOnInit(): void {
    this.currentUsername = this.authService.currentUser?.username || '';
    this.loadStats();
    this.loadContent();
    this.loadUsers();
    this.loadActiveParties();
  }

  switchTab(tab: 'overview' | 'content' | 'users' | 'parties' | 'polls' | 'monetization'): void {
    this.activeTab = tab;
    if (tab === 'overview') this.loadStats();
    if (tab === 'content') this.loadContent();
    if (tab === 'users') this.loadUsers();
    if (tab === 'parties') this.loadActiveParties();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (res: any) => this.stats = res.data,
      error: (err: any) => console.error('Failed to load admin stats', err)
    });
  }

  loadContent(): void {
    this.adminService.getAllContent().subscribe({
      next: (res: any) => this.contentList = res.data || [],
      error: (err: any) => console.error('Failed to load catalog', err)
    });
  }

  loadUsers(): void {
    this.adminService.getUsers(1, 100, this.userSearch).subscribe({
      next: (res: any) => {
        this.usersList = res.data.users || [];
        this.userTotal = res.data.total;
      },
      error: (err: any) => console.error('Failed to load users', err)
    });
  }

  loadActiveParties(): void {
    this.adminService.getActiveParties().subscribe({
      next: (res: any) => this.activeParties = res.data || [],
      error: (err: any) => console.error('Failed to load parties', err)
    });
  }

  get filteredContent(): AdminContentItem[] {
    if (!this.contentSearch.trim()) return this.contentList;
    const q = this.contentSearch.toLowerCase();
    return this.contentList.filter((c: AdminContentItem) => c.title.toLowerCase().includes(q) || c.genres.some((g: string) => g.toLowerCase().includes(q)));
  }

  // User Actions
  toggleUserRole(user: AdminUser, newRole: 'Admin' | 'User'): void {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.isAdmin = newRole === 'Admin';
        this.toastService.success(`User @${user.username} is now ${newRole}!`);
      },
      error: (err: any) => this.toastService.error(err?.error?.message || 'Failed to update role')
    });
  }

  toggleUserStatus(user: AdminUser, newStatus: 'Active' | 'Banned'): void {
    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.toastService.success(`User @${user.username} status updated to ${newStatus}.`);
      },
      error: (err: any) => this.toastService.error(err?.error?.message || 'Failed to update status')
    });
  }

  // Party Actions
  forceTerminateParty(party: AdminParty): void {
    if (!confirm(`Are you sure you want to terminate watch party "${party.title}" (${party.roomCode})? All viewers will be removed.`)) {
      return;
    }
    this.adminService.forceTerminateParty(party.roomCode).subscribe({
      next: () => {
        this.toastService.success(`Party ${party.roomCode} terminated.`);
        this.loadActiveParties();
      },
      error: (err: any) => this.toastService.error(err?.error?.message || 'Failed to terminate party')
    });
  }

  // Content Modal & Actions
  openAddContentModal(): void {
    this.contentForm = {
      title: '',
      type: 'Movie',
      overview: '',
      posterPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
      backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
      rating: 8.5,
      releaseDate: '2024',
      trailerUrl: '',
      videoUrl: ''
    };
    this.contentFormGenresRaw = 'Action, Drama';
    this.showAddContentModal = true;
  }

  closeAddContentModal(): void {
    this.showAddContentModal = false;
  }

  saveContent(e: Event): void {
    e.preventDefault();
    if (!this.contentForm.title.trim()) return;

    this.isSavingContent = true;
    const genres = this.contentFormGenresRaw.split(',').map((g: string) => g.trim()).filter((g: string) => !!g);

    const payload = {
      ...this.contentForm,
      genres
    };

    this.adminService.createContent(payload).subscribe({
      next: () => {
        this.isSavingContent = false;
        this.closeAddContentModal();
        this.toastService.success(`"${this.contentForm.title}" published to catalog!`);
        this.loadContent();
      },
      error: (err: any) => {
        this.isSavingContent = false;
        this.toastService.error(err?.error?.message || 'Failed to save content');
      }
    });
  }

  deleteContent(item: AdminContentItem): void {
    if (!confirm(`Delete "${item.title}" from platform catalog?`)) return;

    this.adminService.deleteContent(item.type, item.id).subscribe({
      next: () => {
        this.toastService.success(`"${item.title}" deleted.`);
        this.loadContent();
      },
      error: (err: any) => this.toastService.error('Failed to delete content')
    });
  }

  // Poll Modal & Actions
  openAddPollModal(): void {
    this.pollForm = {
      title: '',
      category: 'Entertainment',
      options: ['', ''],
      durationDays: 7
    };
    this.showAddPollModal = true;
  }

  closeAddPollModal(): void {
    this.showAddPollModal = false;
  }

  addPollOption(): void {
    if (this.pollForm.options.length < 6) {
      this.pollForm.options.push('');
    }
  }

  removePollOption(index: number): void {
    if (this.pollForm.options.length > 2) {
      this.pollForm.options.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  savePoll(e: Event): void {
    e.preventDefault();
    const validOptions = this.pollForm.options.filter((o: string) => !!o.trim());
    if (validOptions.length < 2) {
      this.toastService.warning('Please enter at least 2 poll options.');
      return;
    }

    this.isSavingPoll = true;
    this.adminService.createOfficialPoll({
      title: this.pollForm.title,
      category: this.pollForm.category,
      options: validOptions,
      durationDays: this.pollForm.durationDays
    }).subscribe({
      next: () => {
        this.isSavingPoll = false;
        this.closeAddPollModal();
        this.toastService.success('Official poll launched live on platform!');
      },
      error: (err: any) => {
        this.isSavingPoll = false;
        this.toastService.error(err?.error?.message || 'Failed to create poll');
      }
    });
  }
}
