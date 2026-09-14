import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserProfileService, UserProfileDto, UpdateProfileRequest } from '../../../core/services/user-profile.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-page">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading cinephile profile...</p>
      </div>

      <div *ngIf="!isLoading && profile" class="profile-container">
        <!-- Profile Banner & Header -->
        <header class="profile-header-card">
          <div class="banner-gradient"></div>
          
          <div class="header-content">
            <div class="avatar-col">
              <div class="avatar-frame">
                <img *ngIf="profile.avatarUrl; else textAvatar" [src]="profile.avatarUrl" [alt]="profile.username" class="avatar-img" />
                <ng-template #textAvatar>
                  <div class="avatar-placeholder">
                    {{ profile.username.charAt(0).toUpperCase() }}
                  </div>
                </ng-template>
              </div>
            </div>

            <div class="info-col">
              <div class="title-row">
                <div>
                  <h1 class="user-fullname">{{ profile.fullName || profile.username }}</h1>
                  <span class="user-handle">&#64;{{ profile.username }}</span>
                </div>

                <div class="profile-actions">
                  <button *ngIf="isCurrentUser" (click)="openEditModal()" class="btn btn-outline" id="btn-edit-profile">
                    ✏️ Edit Profile
                  </button>
                  <ng-container *ngIf="!isCurrentUser">
                    <span *ngIf="friendshipStatus === 'Friends'" class="badge-chip friend-status-chip">
                      🤝 Friends
                    </span>
                    <span *ngIf="friendshipStatus === 'PendingOutgoing'" class="badge-chip pending-status-chip">
                      ⏳ Request Sent
                    </span>
                    <button 
                      *ngIf="friendshipStatus === 'None' || friendshipStatus === 'PendingIncoming'" 
                      (click)="sendFriendRequest()" 
                      class="btn btn-primary" 
                      id="btn-add-friend">
                      ➕ Add Friend
                    </button>
                    <a [routerLink]="['/messages']" [queryParams]="{ chatWith: profile.id, username: profile.username }" class="btn btn-outline">
                      💬 Message
                    </a>
                  </ng-container>
                </div>
              </div>

              <p class="user-bio">
                {{ profile.bio || 'Film enthusiast, watch party regular, and storytelling lover.' }}
              </p>

              <!-- Badges Row -->
              <div class="badges-row">
                <div *ngFor="let badge of profile.badges" class="badge-chip" [title]="badge.description">
                  <span class="badge-icon">{{ badge.icon }}</span>
                  <span class="badge-name">{{ badge.title }}</span>
                </div>
                <div class="join-date-tag">
                  🗓️ Joined {{ formatDate(profile.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Stats Counter Grid -->
        <section class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ profile.stats.totalWatchTimeMinutes }}m</div>
            <div class="stat-label">Watch Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ profile.stats.showsCompleted }}</div>
            <div class="stat-label">Shows Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ profile.stats.moviesWatched }}</div>
            <div class="stat-label">Movies Watched</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ profile.hostedPartiesCount }}</div>
            <div class="stat-label">Parties Hosted</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ profile.stats.reputationScore }}</div>
            <div class="stat-label">Reputation Score</div>
          </div>
        </section>

        <!-- Hosted Watch Parties by User -->
        <section class="hosted-parties-section">
          <div class="section-title-wrap">
            <h2>🍿 Watch Parties by &#64;{{ profile.username }}</h2>
          </div>

          <div *ngIf="profile.hostedParties.length === 0" class="empty-parties">
            <p>No watch parties hosted yet.</p>
            <a *ngIf="isCurrentUser" routerLink="/watch-parties" class="btn btn-primary btn-sm">
              Host Your First Party
            </a>
          </div>

          <div *ngIf="profile.hostedParties.length > 0" class="hosted-grid">
            <div *ngFor="let p of profile.hostedParties" class="hosted-card">
              <div class="hosted-meta">
                <span class="hosted-title">{{ p.title }}</span>
                <span class="hosted-code">#{{ p.roomCode }}</span>
              </div>
              <a [routerLink]="['/watch-parties', p.roomCode]" class="btn btn-outline btn-sm">
                Enter Room →
              </a>
            </div>
          </div>
        </section>
      </div>

      <!-- Edit Profile Modal -->
      <div *ngIf="showEditModal" class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">✏️</span>
              <h2>Edit Profile</h2>
            </div>
            <button (click)="closeEditModal()" class="close-btn">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Full Display Name</label>
              <input 
                type="text" 
                [(ngModel)]="editForm.fullName" 
                placeholder="e.g. Kabir Sharma"
                class="form-control"
                id="input-edit-fullname"
              />
            </div>

            <div class="form-group">
              <label>Bio / About Me</label>
              <textarea 
                [(ngModel)]="editForm.bio" 
                placeholder="Tell cinephiles about your taste in films and shows..."
                class="form-control"
                rows="3"
                id="input-edit-bio">
              </textarea>
            </div>

            <div class="form-group">
              <label>Avatar URL (Image Link)</label>
              <input 
                type="text" 
                [(ngModel)]="editForm.avatarUrl" 
                placeholder="https://..."
                class="form-control"
                id="input-edit-avatar-url"
              />
            </div>

            <div class="avatar-presets">
              <label>Or pick an instant avatar:</label>
              <div class="preset-avatars">
                <button type="button" *ngFor="let av of avatarPresets" (click)="editForm.avatarUrl = av.url" class="av-btn">
                  <img [src]="av.url" [alt]="av.label" />
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="closeEditModal()" class="btn btn-outline">Cancel</button>
            <button (click)="saveProfile()" [disabled]="isSaving" class="btn btn-primary" id="btn-save-profile">
              {{ isSaving ? 'Saving Changes...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: calc(100vh - 70px);
      background: #0B0E14;
      color: #ffffff;
      padding-bottom: 80px;
    }

    .loading-container {
      text-align: center;
      padding: 100px 20px;
      color: #94a3b8;
    }

    .profile-container {
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* Header Card */
    .profile-header-card {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      overflow: hidden;
      position: relative;
    }

    .banner-gradient {
      height: 140px;
      background: linear-gradient(135deg, rgba(229, 9, 20, 0.6) 0%, rgba(99, 102, 241, 0.6) 100%);
    }

    .header-content {
      padding: 0 32px 32px;
      display: flex;
      gap: 28px;
      margin-top: -60px;
      position: relative;
      z-index: 2;
    }

    .avatar-frame {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid #131823;
      background: #1e293b;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(135deg, #e50914, #6366f1);
    }

    .info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 10px;
    }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .user-fullname {
      font-size: 1.8rem;
      font-weight: 900;
      margin: 0;
      color: #ffffff;
      line-height: 1.2;
    }

    .user-handle {
      font-size: 1rem;
      color: #94a3b8;
      font-family: monospace;
    }

    .profile-actions {
      display: flex;
      gap: 10px;
    }

    .user-bio {
      font-size: 0.95rem;
      color: #cbd5e1;
      line-height: 1.5;
      margin: 0;
      max-width: 650px;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .friend-status-chip {
      background: rgba(16, 185, 129, 0.15) !important;
      border: 1px solid rgba(16, 185, 129, 0.4) !important;
      color: #34d399 !important;
      font-weight: 700;
      padding: 6px 14px;
    }

    .pending-status-chip {
      background: rgba(245, 158, 11, 0.15) !important;
      border: 1px solid rgba(245, 158, 11, 0.4) !important;
      color: #fbbf24 !important;
      font-weight: 700;
      padding: 6px 14px;
    }

    .badge-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .badge-icon {
      font-size: 1rem;
    }

    .join-date-tag {
      font-size: 0.8rem;
      color: #64748b;
      margin-left: auto;
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(229, 9, 20, 0.3);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 4px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Hosted Parties */
    .hosted-parties-section {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 24px;
    }

    .section-title-wrap h2 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 16px;
    }

    .empty-parties {
      color: #94a3b8;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .hosted-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }

    .hosted-card {
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .hosted-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hosted-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }

    .hosted-code {
      font-family: monospace;
      font-size: 0.78rem;
      color: #64748b;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-dialog {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modal-icon { font-size: 1.4rem; }

    .modal-header h2 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.8rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 0.88rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .form-control {
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px 14px;
      color: #ffffff;
      font-size: 0.95rem;
      outline: none;
    }

    .avatar-presets {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .avatar-presets label {
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .preset-avatars {
      display: flex;
      gap: 10px;
    }

    .av-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid transparent;
      background: #1e293b;
      cursor: pointer;
      padding: 0;
      transition: transform 0.2s, border-color 0.2s;
    }

    .av-btn:hover {
      transform: scale(1.1);
      border-color: #e50914;
    }

    .av-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .title-row {
        flex-direction: column;
        align-items: center;
      }
      .join-date-tag {
        margin-left: 0;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  profileService = inject(UserProfileService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  profile: UserProfileDto | null = null;
  isLoading = true;
  isCurrentUser = false;
  friendshipStatus: 'None' | 'Friends' | 'PendingOutgoing' | 'PendingIncoming' | 'Self' = 'None';

  showEditModal = false;
  isSaving = false;

  editForm: UpdateProfileRequest = {
    fullName: '',
    bio: '',
    avatarUrl: ''
  };

  avatarPresets = [
    { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Cinephile 1' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Cinephile 2' },
    { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', label: 'Cinephile 3' },
    { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', label: 'Cinephile 4' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      let username = params.get('username');
      if (!username) {
        const current = this.authService.currentUser;
        if (current?.username) {
          username = current.username;
        } else {
          this.router.navigate(['/auth/login']);
          return;
        }
      }
      this.loadProfile(username);
    });
  }

  loadProfile(username: string): void {
    this.isLoading = true;
    this.profileService.getUserProfile(username).subscribe({
      next: (res) => {
        this.profile = res.data;
        const current = this.authService.currentUser;
        this.isCurrentUser = current?.username?.toLowerCase() === this.profile.username?.toLowerCase();
        
        this.editForm = {
          fullName: this.profile.fullName || '',
          bio: this.profile.bio || '',
          avatarUrl: this.profile.avatarUrl || ''
        };
        this.isLoading = false;

        if (!this.isCurrentUser && this.authService.isAuthenticated) {
          this.friendService.getFriendshipStatus(this.profile.username).subscribe({
            next: (statusRes) => {
              if (statusRes?.data?.status) {
                this.friendshipStatus = statusRes.data.status;
              }
            }
          });
        }
      },
      error: (err) => {
        this.toastService.error('Profile not found.');
        this.router.navigate(['/discovery']);
      }
    });
  }

  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveProfile(): void {
    this.isSaving = true;
    this.profileService.updateProfile(this.editForm).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.closeEditModal();
        this.toastService.success('Profile updated successfully!');
        if (this.profile) {
          this.profile.fullName = this.editForm.fullName;
          this.profile.bio = this.editForm.bio;
          this.profile.avatarUrl = this.editForm.avatarUrl;
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error(err?.error?.message || 'Failed to update profile.');
      }
    });
  }

  sendFriendRequest(): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.warning('Please log in to send friend requests.');
      this.router.navigate(['/auth/login']);
      return;
    }
    if (!this.profile) return;

    this.friendService.sendFriendRequest(this.profile.username).subscribe({
      next: () => {
        this.friendshipStatus = 'PendingOutgoing';
        this.toastService.success(`Friend request sent to @${this.profile!.username}!`);
      },
      error: (err) => {
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('already friends')) {
          this.friendshipStatus = 'Friends';
          this.toastService.info(`You are already friends with @${this.profile!.username}.`);
        } else if (msg.toLowerCase().includes('already pending') || msg.toLowerCase().includes('pending')) {
          this.friendshipStatus = 'PendingOutgoing';
          this.toastService.info(`Friend request to @${this.profile!.username} is already pending.`);
        } else {
          this.toastService.info(msg || 'Could not send request.');
        }
      }
    });
  }

  formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }
}
