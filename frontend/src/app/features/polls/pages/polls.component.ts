import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PollService, PollDto, CreatePollRequest } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="polls-page">
      <!-- Hero Banner -->
      <section class="polls-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span>🗳️</span> OFFICIAL FAN POLLS & LIVE VOTING
          </div>
          <h1 class="hero-title">Audience Voice & Entertainment Polls</h1>
          <p class="hero-subtitle">
            Vote on weekly Bigg Boss evictions, cinematic box-office clashes, and fan-favorite OTT series. Real-time verified community results.
          </p>

          <div class="hero-actions">
            <button (click)="openCreateModal()" class="btn btn-primary" id="btn-create-poll-header">
              <span>➕</span> Create New Poll
            </button>
            <button (click)="loadPolls()" class="btn btn-outline">
              🔄 Refresh Votes
            </button>
          </div>
        </div>
      </section>

      <!-- Main Container -->
      <div class="polls-container">
        <!-- Filter Tabs -->
        <div class="filter-bar">
          <div class="category-pills">
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory === 'ALL'"
              (click)="filterByCategory('ALL')">
              All Polls
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory === 'BIGG_BOSS'"
              (click)="filterByCategory('BIGG_BOSS')">
              🔥 Bigg Boss 18
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory === 'CINEMA'"
              (click)="filterByCategory('CINEMA')">
              🎬 Cinema Clashes
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory === 'OTT'"
              (click)="filterByCategory('OTT')">
              📺 OTT Shows
            </button>
          </div>

          <div class="total-stats-pill">
            <span>📊 Total Active Polls: {{ filteredPolls.length }}</span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading live audience polls...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredPolls.length === 0" class="empty-state">
          <div class="empty-icon">🗳️</div>
          <h3>No Polls in this Category</h3>
          <p>Create the first poll or switch to All Polls to see community debates.</p>
          <button (click)="openCreateModal()" class="btn btn-primary">
            Create a Fan Poll
          </button>
        </div>

        <!-- Polls Grid -->
        <div *ngIf="!isLoading && filteredPolls.length > 0" class="polls-grid">
          <div *ngFor="let poll of filteredPolls" class="poll-card">
            <!-- Card Header -->
            <div class="poll-card-header">
              <div class="poll-meta-left">
                <span class="category-tag">Fan Debate</span>
                <span class="status-live">
                  <span class="live-dot"></span> Active Voting
                </span>
              </div>
              <div class="votes-pill">
                👥 {{ poll.totalVotes }} Votes Cast
              </div>
            </div>

            <!-- Poll Question -->
            <h2 class="poll-question">{{ poll.title }}</h2>
            <p *ngIf="poll.description" class="poll-desc">{{ poll.description }}</p>

            <!-- Options (Either Voting Mode or Results Mode) -->
            <div class="poll-options-list">
              <!-- If already voted or showing results -->
              <ng-container *ngIf="poll.hasVoted; else votingForm">
                <div class="voted-banner">
                  <span>✅ You have cast your vote on this poll.</span>
                </div>

                <div *ngFor="let opt of poll.options" class="result-option-row">
                  <div class="result-bar-bg">
                    <div class="result-bar-fill" [style.width.%]="opt.percentage"></div>
                  </div>
                  <div class="result-content">
                    <span class="option-title">{{ opt.optionText }}</span>
                    <span class="option-stats">
                      <strong>{{ opt.percentage }}%</strong> ({{ opt.votesCount }} votes)
                    </span>
                  </div>
                </div>
              </ng-container>

              <!-- If not yet voted: Interactive radio options -->
              <ng-template #votingForm>
                <div *ngFor="let opt of poll.options" class="vote-option-label" (click)="selectOption(poll.id, opt.id)">
                  <div class="radio-circle" [class.selected]="selectedOptions[poll.id] === opt.id">
                    <div class="radio-inner" *ngIf="selectedOptions[poll.id] === opt.id"></div>
                  </div>
                  <span class="option-text">{{ opt.optionText }}</span>
                </div>

                <div class="vote-action-footer">
                  <button 
                    (click)="submitVote(poll)" 
                    class="btn btn-primary btn-block" 
                    [disabled]="!selectedOptions[poll.id]"
                    [id]="'btn-vote-' + poll.id">
                    Cast My Vote 🗳️
                  </button>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Create Poll Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">🗳️</span>
              <h2>Create New Fan Poll (Admin)</h2>
            </div>
            <button (click)="closeCreateModal()" class="close-btn">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Poll Title / Question *</label>
              <input 
                type="text" 
                [(ngModel)]="newPoll.title" 
                placeholder="e.g. Bigg Boss 18: Who is your winner pick?"
                class="form-control"
                id="input-poll-title"
              />
            </div>

            <div class="form-group">
              <label>Description (Optional)</label>
              <textarea 
                [(ngModel)]="newPoll.description" 
                placeholder="Give context or rules for this vote..."
                class="form-control text-area"
                rows="2">
              </textarea>
            </div>

            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="newPoll.category" class="form-control">
                <option value="Bigg Boss Fan Poll">Bigg Boss Fan Poll</option>
                <option value="Cinema Clashes">Cinema Clashes & Box Office</option>
                <option value="OTT Releases">OTT Releases & Series</option>
                <option value="Fan Community">Fan Community Choice</option>
              </select>
            </div>

            <div class="form-group">
              <div class="options-header">
                <label>Voting Options (Minimum 2) *</label>
                <button type="button" (click)="addOptionField()" class="btn-add-option">
                  + Add Option
                </button>
              </div>

              <div class="options-inputs-list">
                <div *ngFor="let opt of newPoll.options; let i = index; trackBy: trackByIndex" class="option-input-row">
                  <span class="opt-num">{{ i + 1 }}.</span>
                  <input 
                    type="text" 
                    [(ngModel)]="newPoll.options[i]" 
                    [placeholder]="'Option ' + (i + 1)"
                    class="form-control opt-field"
                    [id]="'input-poll-opt-' + i"
                  />
                  <button 
                    *ngIf="newPoll.options.length > 2" 
                    (click)="removeOptionField(i)" 
                    class="remove-opt-btn"
                    title="Remove this option">
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Voting Duration</label>
              <select [(ngModel)]="newPoll.durationDays" class="form-control">
                <option [ngValue]="1">24 Hours (Flash Poll)</option>
                <option [ngValue]="3">3 Days (Weekend Eviction Poll)</option>
                <option [ngValue]="7">7 Days (Weekly Round)</option>
                <option [ngValue]="14">14 Days (Extended Debate)</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="closeCreateModal()" class="btn btn-outline">Cancel</button>
            <button (click)="submitCreatePoll()" [disabled]="isSubmitting" class="btn btn-primary" id="btn-submit-create-poll">
              {{ isSubmitting ? 'Publishing...' : '🚀 Publish Live Poll' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .polls-page {
      min-height: calc(100vh - 70px);
      background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), #0B0E14;
      color: #ffffff;
      padding-bottom: 80px;
    }

    .polls-hero {
      padding: 60px 24px 40px;
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #818cf8;
      margin-bottom: 20px;
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
      gap: 16px;
      flex-wrap: wrap;
    }

    .polls-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .category-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pill-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pill-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .pill-btn.active {
      color: #fff;
      background: #e50914;
      border-color: #e50914;
      box-shadow: 0 4px 14px rgba(229, 9, 20, 0.35);
    }

    .total-stats-pill {
      font-size: 0.88rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .polls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
      gap: 28px;
    }

    .poll-card {
      background: #131823;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: transform 0.2s, border-color 0.2s;
    }

    .poll-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
    }

    .poll-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .poll-meta-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-tag {
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 3px 10px;
      border-radius: 6px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .status-live {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #34d399;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
    }

    .votes-pill {
      font-size: 0.82rem;
      color: #94a3b8;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 10px;
      border-radius: 999px;
    }

    .poll-question {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.35;
      margin: 0;
    }

    .poll-desc {
      font-size: 0.9rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }

    .poll-options-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 4px;
    }

    .voted-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 6px;
    }

    /* Result progress bars */
    .result-option-row {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.07);
      min-height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }

    .result-bar-bg {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    .result-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, rgba(229, 9, 20, 0.35), rgba(99, 102, 241, 0.45));
      transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .result-content {
      position: relative;
      z-index: 2;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .option-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #ffffff;
    }

    .option-stats {
      font-size: 0.88rem;
      color: #cbd5e1;
    }

    /* Voting Mode */
    .vote-option-label {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .vote-option-label:hover {
      border-color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.03);
    }

    .radio-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s;
      flex-shrink: 0;
    }

    .radio-circle.selected {
      border-color: #e50914;
    }

    .radio-inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e50914;
    }

    .option-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .vote-action-footer {
      margin-top: 8px;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 700;
    }

    /* Modal */
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
      cursor: pointer;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 70vh;
      overflow-y: auto;
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

    .form-control:focus {
      border-color: #6366f1;
    }

    .text-area {
      resize: vertical;
    }

    .options-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-add-option {
      background: transparent;
      border: none;
      color: #818cf8;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-add-option:hover {
      text-decoration: underline;
    }

    .options-inputs-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .option-input-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .opt-num {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      width: 18px;
    }

    .opt-field {
      flex: 1;
      padding: 10px 12px;
    }

    .remove-opt-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
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

    @media (max-width: 768px) {
      .polls-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PollsComponent implements OnInit {
  pollService = inject(PollService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  polls: PollDto[] = [];
  filteredPolls: PollDto[] = [];
  selectedCategory = 'ALL';
  isLoading = true;

  selectedOptions: { [pollId: string]: string } = {};

  showCreateModal = false;
  isSubmitting = false;

  newPoll: CreatePollRequest = {
    title: '',
    description: '',
    category: 'Bigg Boss Fan Poll',
    options: ['', '', ''],
    durationDays: 7
  };

  ngOnInit(): void {
    this.loadPolls();
  }

  loadPolls(): void {
    this.isLoading = true;
    this.pollService.getPolls().subscribe({
      next: (res) => {
        this.polls = res.data || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load polls', err);
        this.isLoading = false;
      }
    });
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedCategory === 'ALL') {
      this.filteredPolls = this.polls;
    } else if (this.selectedCategory === 'BIGG_BOSS') {
      this.filteredPolls = this.polls.filter(p => p.title.toLowerCase().includes('bigg boss') || (p.description && p.description.toLowerCase().includes('bigg boss')));
    } else if (this.selectedCategory === 'CINEMA') {
      this.filteredPolls = this.polls.filter(p => p.title.toLowerCase().includes('cinema') || p.title.toLowerCase().includes('dune') || p.title.toLowerCase().includes('pushpa'));
    } else {
      this.filteredPolls = this.polls;
    }
  }

  selectOption(pollId: string, optionId: string): void {
    this.selectedOptions[pollId] = optionId;
  }

  submitVote(poll: PollDto): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.warning('Please log in to cast your vote.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const optionId = this.selectedOptions[poll.id];
    if (!optionId) {
      this.toastService.warning('Please select an option to vote.');
      return;
    }

    this.pollService.vote(poll.id, optionId).subscribe({
      next: () => {
        this.toastService.success('Vote recorded successfully!');
        this.loadPolls();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to record vote.');
      }
    });
  }

  openCreateModal(): void {
    if (!this.authService.isAuthenticated) {
      this.toastService.warning('Please sign in to publish a poll.');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.newPoll = {
      title: '',
      description: '',
      category: 'Bigg Boss Fan Poll',
      options: ['', '', ''],
      durationDays: 7
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  addOptionField(): void {
    this.newPoll.options.push('');
  }

  removeOptionField(index: number): void {
    if (this.newPoll.options.length > 2) {
      this.newPoll.options.splice(index, 1);
    }
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }

  submitCreatePoll(): void {
    if (!this.newPoll.title.trim()) {
      this.toastService.warning('Please enter a poll title.');
      return;
    }

    const validOptions = this.newPoll.options.map(o => o.trim()).filter(o => o.length > 0);
    if (validOptions.length < 2) {
      this.toastService.warning('Please provide at least 2 non-empty options.');
      return;
    }

    this.isSubmitting = true;
    this.pollService.createPoll({
      title: this.newPoll.title.trim(),
      description: this.newPoll.description?.trim(),
      category: this.newPoll.category,
      options: validOptions,
      durationDays: this.newPoll.durationDays
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.toastService.success('Fan poll published successfully!');
        this.loadPolls();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.error(err?.error?.message || 'Failed to create poll.');
      }
    });
  }
}
