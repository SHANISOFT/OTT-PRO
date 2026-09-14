import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PartyService, WatchPartyDto, CreatePartyRequest } from '../../../../core/services/party.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-party-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="lobby-page">
      <!-- Hero Section -->
      <section class="lobby-hero">
        <div class="hero-content">
          <div class="badge-pill">
            <span class="live-dot"></span> REAL-TIME SYNC & SCREEN SHARE
          </div>
          <h1 class="hero-title">Social Cinema & Watch Parties</h1>
          <p class="hero-subtitle">
            Create public or password-protected rooms, share your screen from any platform (Netflix, Hotstar, YouTube), or stream synced videos. React with friends live!
          </p>

          <div class="hero-actions">
            <button (click)="openCreateModal()" class="btn btn-primary btn-lg" id="btn-create-party-hero">
              <span>🍿</span> Create Watch Party
            </button>
            <div class="quick-join-box">
              <input 
                type="text" 
                [(ngModel)]="quickRoomCode" 
                placeholder="Enter Room Code (e.g. ROOM-XXXXXX)"
                class="join-input"
                id="input-quick-room-code"
                (keyup.enter)="joinWithCode()"
              />
              <button (click)="joinWithCode()" class="btn btn-outline" id="btn-quick-join">
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="lobby-container">
        <!-- Controls & Filters -->
        <div class="section-header">
          <div class="tabs-group">
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'all'" 
              (click)="setTab('all')">
              All Rooms ({{ parties.length }})
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'public'" 
              (click)="setTab('public')">
              Public Rooms
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'private'" 
              (click)="setTab('private')">
              Private (Locked)
            </button>
          </div>

          <button (click)="loadParties()" class="refresh-btn" title="Refresh list">
            🔄 Refresh
          </button>
        </div>

        <!-- Rooms Grid -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading active watch parties...</p>
        </div>

        <div *ngIf="!isLoading && filteredParties.length === 0" class="empty-state">
          <div class="empty-icon">📺</div>
          <h3>No Active Watch Parties</h3>
          <p>Be the first one to create a watch party and invite your friends!</p>
          <button (click)="openCreateModal()" class="btn btn-primary" id="btn-create-first-party">
            Create Party Now
          </button>
        </div>

        <div *ngIf="!isLoading && filteredParties.length > 0" class="parties-grid">
          <div *ngFor="let party of filteredParties" class="party-card">
            <div class="party-card-banner">
              <div class="banner-gradient"></div>
              <div class="party-badges">
                <span class="status-live">
                  <span class="live-dot-pulse"></span> LIVE
                </span>
                <span *ngIf="party.isPrivate" class="lock-badge" title="Private Passcode Protected">
                  🔒 Private
                </span>
                <span *ngIf="!party.isPrivate" class="public-badge">
                  🌐 Public
                </span>
              </div>
              <div class="room-code-tag">
                #{{ party.roomCode }}
              </div>
            </div>

            <div class="party-card-body">
              <h3 class="party-title">{{ party.title }}</h3>
              
              <div class="party-meta">
                <div class="meta-item">
                  <span class="meta-icon">👥</span>
                  <span>{{ party.memberCount || 1 }} / {{ party.maxMembers }} Watching</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">👑</span>
                  <span>Host: <strong>&#64;{{ party.hostUsername || 'Host' }}</strong></span>
                </div>
              </div>

              <div class="party-actions" style="display: flex; gap: 8px;">
                <button (click)="enterParty(party)" class="btn btn-primary" style="flex: 1;" [id]="'btn-enter-' + party.roomCode">
                  {{ party.isPrivate ? '🔒 Unlock & Join' : '🍿 Join Party' }}
                </button>
                <button 
                  *ngIf="party.hostUserId === currentUserId || party.hostUsername === currentUsername" 
                  (click)="deletePartyLobby(party, $event)" 
                  class="btn btn-danger" 
                  style="padding: 8px 12px;"
                  title="Delete Watch Party">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Party Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">🎬</span>
              <h2>Create New Watch Party</h2>
            </div>
            <button (click)="closeCreateModal()" class="close-btn">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Room Title *</label>
              <input 
                type="text" 
                [(ngModel)]="newParty.title" 
                placeholder="e.g. Dune 2 Premiere with Friends"
                class="form-control"
                id="input-party-title"
              />
            </div>

            <div class="form-group">
              <label>Room Access Privacy</label>
              <div class="privacy-selector">
                <button 
                  type="button" 
                  class="privacy-btn" 
                  [class.active]="!newParty.isPrivate"
                  (click)="newParty.isPrivate = false">
                  <span class="p-icon">🌐</span>
                  <div class="p-text">
                    <strong>Public</strong>
                    <small>Anyone can discover & join</small>
                  </div>
                </button>
                <button 
                  type="button" 
                  class="privacy-btn" 
                  [class.active]="newParty.isPrivate"
                  (click)="newParty.isPrivate = true">
                  <span class="p-icon">🔒</span>
                  <div class="p-text">
                    <strong>Private</strong>
                    <small>Requires passcode to join</small>
                  </div>
                </button>
              </div>
            </div>

            <div *ngIf="newParty.isPrivate" class="form-group">
              <label>Passcode / PIN *</label>
              <input 
                type="text" 
                [(ngModel)]="newParty.passcode" 
                placeholder="e.g. 1234 or CINEMA"
                class="form-control"
                id="input-party-passcode"
              />
            </div>

            <div class="form-group">
              <label>Video Stream / Platform Source (Optional)</label>
              <input 
                type="text" 
                [(ngModel)]="newParty.videoSourceUrl" 
                placeholder="YouTube URL or direct video stream (or choose Live Screen Share inside room)"
                class="form-control"
                id="input-party-video-url"
              />
              <span class="hint-text">
                💡 Tip: You can also use live <strong>Screen Sharing</strong> inside the room to share Netflix, Prime, Hotstar, or any browser tab!
              </span>
            </div>

            <div class="form-group">
              <label>Max Attendees</label>
              <select [(ngModel)]="newParty.maxMembers" class="form-control">
                <option [ngValue]="10">10 Friends (Intimate)</option>
                <option [ngValue]="25">25 Attendees (Standard)</option>
                <option [ngValue]="50">50 Attendees (Watch Party)</option>
                <option [ngValue]="100">100 Attendees (Cinema Hall)</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="closeCreateModal()" class="btn btn-outline">Cancel</button>
            <button (click)="submitCreateParty()" [disabled]="isSubmitting" class="btn btn-primary" id="btn-submit-create-party">
              {{ isSubmitting ? 'Creating Room...' : '🚀 Launch Room' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Passcode Prompt Modal -->
      <div *ngIf="showPasscodeModal" class="modal-backdrop" (click)="closePasscodeModal()">
        <div class="modal-dialog passcode-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">🔒</span>
              <h2>Private Room Passcode</h2>
            </div>
            <button (click)="closePasscodeModal()" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <p>This room is private. Please enter the passcode provided by the host:</p>
            <input 
              type="password" 
              [(ngModel)]="enteredPasscode" 
              placeholder="Enter PIN / Passcode"
              class="form-control passcode-input"
              id="input-entered-passcode"
              (keyup.enter)="verifyAndJoinPrivateRoom()"
            />
          </div>
          <div class="modal-footer">
            <button (click)="closePasscodeModal()" class="btn btn-outline">Cancel</button>
            <button (click)="verifyAndJoinPrivateRoom()" class="btn btn-primary" id="btn-verify-passcode">
              Unlock Room
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-page {
      min-height: calc(100vh - 70px);
      background: radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.08) 0%, transparent 60%), #0B0E14;
      color: #ffffff;
      padding-bottom: 80px;
    }

    .lobby-hero {
      padding: 60px 24px 40px;
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(229, 9, 20, 0.15);
      border: 1px solid rgba(229, 9, 20, 0.35);
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #ff4d52;
      margin-bottom: 20px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e50914;
      animation: pulse 1.5s infinite;
    }

    .hero-title {
      font-size: 2.8rem;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 32px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .quick-join-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(26, 32, 44, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 4px 6px 4px 14px;
    }

    .join-input {
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 0.95rem;
      outline: none;
      width: 250px;
    }

    .join-input::placeholder {
      color: #64748b;
    }

    .lobby-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
    }

    .tabs-group {
      display: flex;
      gap: 10px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.04);
    }

    .tab-btn.active {
      color: #ffffff;
      background: rgba(229, 9, 20, 0.2);
      border: 1px solid rgba(229, 9, 20, 0.4);
    }

    .refresh-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .parties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .party-card {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    .party-card:hover {
      transform: translateY(-4px);
      border-color: rgba(229, 9, 20, 0.4);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }

    .party-card-banner {
      height: 120px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      position: relative;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .banner-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 80% 20%, rgba(229, 9, 20, 0.3) 0%, transparent 60%);
    }

    .party-badges {
      position: relative;
      display: flex;
      gap: 8px;
      z-index: 2;
    }

    .status-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(229, 9, 20, 0.9);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 999px;
      letter-spacing: 0.05em;
    }

    .live-dot-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffffff;
      animation: pulse 1s infinite;
    }

    .lock-badge {
      padding: 4px 10px;
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 999px;
    }

    .public-badge {
      padding: 4px 10px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 999px;
    }

    .room-code-tag {
      position: relative;
      align-self: flex-start;
      font-family: monospace;
      font-size: 0.85rem;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.5);
      padding: 2px 8px;
      border-radius: 6px;
      z-index: 2;
    }

    .party-card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
      gap: 16px;
    }

    .party-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      margin: 0;
    }

    .party-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.88rem;
      color: #94a3b8;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .party-actions {
      margin-top: 8px;
    }

    .btn-block {
      width: 100%;
      padding: 10px;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 80px 20px;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
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
      max-width: 550px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      animation: modalFadeIn 0.25s ease-out;
    }

    .passcode-dialog {
      max-width: 420px;
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
      gap: 12px;
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.8rem;
      line-height: 1;
      cursor: pointer;
    }

    .close-btn:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
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
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #e50914;
    }

    .hint-text {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .privacy-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .privacy-btn {
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }

    .privacy-btn:hover {
      border-color: rgba(255, 255, 255, 0.25);
    }

    .privacy-btn.active {
      border-color: #e50914;
      background: rgba(229, 9, 20, 0.12);
    }

    .p-icon {
      font-size: 1.4rem;
    }

    .p-text strong {
      display: block;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .p-text small {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PartyLobbyComponent implements OnInit {
  partyService = inject(PartyService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  parties: WatchPartyDto[] = [];
  filteredParties: WatchPartyDto[] = [];
  activeTab: 'all' | 'public' | 'private' = 'all';
  isLoading = true;

  quickRoomCode = '';
  showCreateModal = false;
  isSubmitting = false;

  newParty: CreatePartyRequest = {
    title: '',
    isPrivate: false,
    passcode: '',
    videoSourceUrl: '',
    maxMembers: 50
  };

  showPasscodeModal = false;
  pendingParty: WatchPartyDto | null = null;
  enteredPasscode = '';
  currentUserId = '';

  currentUsername = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUserId = u?.id || '';
      this.currentUsername = u?.username || '';
    });
    this.loadParties();
  }

  loadParties(): void {
    this.isLoading = true;
    this.partyService.getActiveParties().subscribe({
      next: (res) => {
        this.parties = res.data || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load parties', err);
        this.isLoading = false;
      }
    });
  }

  setTab(tab: 'all' | 'public' | 'private'): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeTab === 'all') {
      this.filteredParties = this.parties;
    } else if (this.activeTab === 'public') {
      this.filteredParties = this.parties.filter(p => !p.isPrivate);
    } else {
      this.filteredParties = this.parties.filter(p => p.isPrivate);
    }
  }

  openCreateModal(): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.warning('Please sign in to host a watch party');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.newParty = {
      title: '',
      isPrivate: false,
      passcode: '',
      videoSourceUrl: '',
      maxMembers: 50
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateParty(): void {
    if (!this.newParty.title.trim()) {
      this.toastService.warning('Please enter a party title');
      return;
    }
    if (this.newParty.isPrivate && !this.newParty.passcode?.trim()) {
      this.toastService.warning('Please set a passcode for private party');
      return;
    }

    this.isSubmitting = true;
    this.partyService.createParty(this.newParty).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.toastService.success(`Watch party "${res.data.title}" created! Code: ${res.data.roomCode}`);
        this.router.navigate(['/watch-parties', res.data.roomCode]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.error(err?.error?.message || 'Failed to create party');
      }
    });
  }

  joinWithCode(): void {
    const code = this.quickRoomCode.trim().toUpperCase();
    if (!code) {
      this.toastService.warning('Please enter a valid room code');
      return;
    }
    this.router.navigate(['/watch-parties', code]);
  }

  enterParty(party: WatchPartyDto): void {
    if (party.isPrivate) {
      this.pendingParty = party;
      this.enteredPasscode = '';
      this.showPasscodeModal = true;
    } else {
      this.router.navigate(['/watch-parties', party.roomCode]);
    }
  }

  closePasscodeModal(): void {
    this.showPasscodeModal = false;
    this.pendingParty = null;
  }

  verifyAndJoinPrivateRoom(): void {
    if (!this.pendingParty) return;
    if (!this.enteredPasscode.trim()) {
      this.toastService.warning('Please enter the passcode');
      return;
    }

    this.partyService.verifyPasscode(this.pendingParty.roomCode, this.enteredPasscode).subscribe({
      next: () => {
        this.toastService.success('Passcode verified! Entering room...');
        const code = this.pendingParty!.roomCode;
        this.closePasscodeModal();
        this.router.navigate(['/watch-parties', code]);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Incorrect passcode');
      }
    });
  }

  deletePartyLobby(party: WatchPartyDto, e: Event): void {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to end and delete "${party.title}"?`)) return;
    this.partyService.deleteParty(party.roomCode).subscribe({
      next: () => {
        this.toastService.success(`Watch party "${party.title}" deleted.`);
        this.loadParties();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete party.');
      }
    });
  }
}
