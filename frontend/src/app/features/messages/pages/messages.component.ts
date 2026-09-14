import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FriendService, FriendDto, FriendRequestDto, DirectMessageDto } from '../../../core/services/friend.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-page">
      <div class="messages-layout">
        <!-- LEFT SIDEBAR: Friends & Incoming Requests -->
        <aside class="contacts-sidebar">
          <!-- Sidebar Header & Add Friend -->
          <div class="sidebar-header">
            <h2 class="sidebar-title">Cinema Friends</h2>
            
            <div class="add-friend-wrap">
              <input 
                type="text" 
                [(ngModel)]="searchUsername" 
                placeholder="Find user by @username..."
                class="add-friend-input"
                id="input-find-friend"
                (keyup.enter)="sendRequest()"
              />
              <button (click)="sendRequest()" class="btn btn-primary btn-sm" id="btn-send-friend-request">
                + Add
              </button>
            </div>
          </div>

          <!-- Incoming Friend Requests Banner (if any) -->
          <div *ngIf="incomingRequests.length > 0" class="requests-section">
            <div class="section-label">
              <span>🔔 Pending Requests ({{ incomingRequests.length }})</span>
            </div>
            <div *ngFor="let req of incomingRequests" class="request-card">
              <div class="req-user">
                <div class="req-avatar">{{ req.senderUsername.charAt(0).toUpperCase() }}</div>
                <span class="req-name">&#64;{{ req.senderUsername }}</span>
              </div>
              <div class="req-actions">
                <button (click)="respondRequest(req.id, true)" class="btn btn-sm btn-success" title="Accept">
                  ✓ Accept
                </button>
                <button (click)="respondRequest(req.id, false)" class="btn btn-sm btn-outline-danger" title="Decline">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Friends List -->
          <div class="friends-list-wrap">
            <div class="section-label">
              <span>👥 All Friends ({{ friends.length }})</span>
            </div>

            <div *ngIf="isLoading" class="loading-contacts">
              <div class="spinner-sm"></div>
              <span>Loading roster...</span>
            </div>

            <div *ngIf="!isLoading && friends.length === 0" class="no-friends">
              <span>👋</span>
              <p>No friends added yet. Enter a username above to send a request!</p>
            </div>

            <div *ngFor="let f of friends" 
              class="friend-item" 
              [class.active]="selectedFriend?.id === f.id"
              (click)="selectFriend(f)">
              <div class="friend-avatar-wrap">
                <div class="friend-avatar">
                  <img *ngIf="f.avatarUrl; else fInitial" [src]="f.avatarUrl" [alt]="f.username" />
                  <ng-template #fInitial>{{ f.username.charAt(0).toUpperCase() }}</ng-template>
                </div>
                <div class="online-dot" *ngIf="f.isOnline"></div>
              </div>

              <div class="friend-info">
                <span class="friend-name">{{ f.fullName || f.username }}</span>
                <span class="friend-handle">&#64;{{ f.username }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT CHAT AREA: 1-on-1 Personal Messaging -->
        <main class="chat-main">
          <!-- Active Friend Chat Header -->
          <div *ngIf="selectedFriend" class="chat-header">
            <div class="chat-header-user">
              <div class="chat-header-avatar">
                <img *ngIf="selectedFriend.avatarUrl; else activeInitial" [src]="selectedFriend.avatarUrl" />
                <ng-template #activeInitial>{{ selectedFriend.username.charAt(0).toUpperCase() }}</ng-template>
              </div>
              <div>
                <h3 class="header-name">{{ selectedFriend.fullName || selectedFriend.username }}</h3>
                <span class="header-status">
                  <span class="status-dot"></span> Online &bull; Direct Message
                </span>
              </div>
            </div>
          </div>

          <!-- Empty No Friend Selected State -->
          <div *ngIf="!selectedFriend" class="no-selection-view">
            <div class="empty-icon">💬</div>
            <h2>Private 1-on-1 Cinephile Chat</h2>
            <p>Select a friend from your roster to start discussing movies, OTT shows, and watch parties.</p>
          </div>

          <!-- Chat Messages Body -->
          <div *ngIf="selectedFriend" class="chat-body" #chatScroll>
            <div *ngIf="messages.length === 0" class="empty-thread">
              <span>✨</span>
              <p>Start your private conversation with &#64;{{ selectedFriend.username }}.</p>
            </div>

            <div *ngFor="let msg of messages" class="msg-bubble-wrap" [class.mine]="msg.isMine">
              <div class="msg-bubble-box">
                <p class="msg-content">{{ msg.message }}</p>
                <span class="msg-timestamp">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Chat Input Footer -->
          <div *ngIf="selectedFriend" class="chat-input-bar">
            <form (submit)="sendMessage($event)" class="message-form">
              <input 
                type="text" 
                [(ngModel)]="draftMessage" 
                name="draftMessage" 
                [placeholder]="'Message @' + selectedFriend.username + '...'"
                class="message-input"
                id="input-direct-message"
                autocomplete="off"
              />
              <button type="submit" class="btn btn-primary" id="btn-send-dm" [disabled]="!draftMessage.trim()">
                Send 🚀
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .messages-page {
      min-height: calc(100vh - 70px);
      background: #0B0E14;
      color: #ffffff;
      display: flex;
    }

    .messages-layout {
      width: 100%;
      display: grid;
      grid-template-columns: 360px 1fr;
      min-height: calc(100vh - 70px);
    }

    /* Contacts Sidebar */
    .contacts-sidebar {
      background: #0e121a;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .sidebar-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      color: #fff;
    }

    .add-friend-wrap {
      display: flex;
      gap: 8px;
    }

    .add-friend-input {
      flex: 1;
      background: #07090E;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      font-size: 0.85rem;
      outline: none;
    }

    .add-friend-input:focus {
      border-color: #e50914;
    }

    .section-label {
      padding: 12px 20px 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Incoming Requests */
    .requests-section {
      background: rgba(229, 9, 20, 0.06);
      border-bottom: 1px solid rgba(229, 9, 20, 0.2);
      padding-bottom: 10px;
    }

    .request-card {
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .req-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .req-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e50914;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .req-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .req-actions {
      display: flex;
      gap: 6px;
    }

    .btn-success {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    /* Friends List */
    .friends-list-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .friend-item {
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .friend-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .friend-item.active {
      background: rgba(229, 9, 20, 0.12);
      border-left: 3px solid #e50914;
    }

    .friend-avatar-wrap {
      position: relative;
    }

    .friend-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e50914, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      overflow: hidden;
    }

    .friend-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .online-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #0e121a;
      position: absolute;
      bottom: 0;
      right: 0;
    }

    .friend-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .friend-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .friend-handle {
      font-size: 0.78rem;
      color: #64748b;
    }

    .no-friends, .loading-contacts {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
      font-size: 0.88rem;
    }

    .no-friends span {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }

    /* Chat Main Panel */
    .chat-main {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px);
      background: #07090E;
    }

    .chat-header {
      height: 64px;
      background: #0e121a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chat-header-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-header-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e50914;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      overflow: hidden;
    }

    .chat-header-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-name {
      font-size: 1rem;
      font-weight: 800;
      margin: 0;
      color: #fff;
    }

    .header-status {
      font-size: 0.75rem;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    /* Chat Messages Body */
    .chat-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .empty-thread {
      text-align: center;
      margin: auto;
      color: #64748b;
    }

    .empty-thread span {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 10px;
    }

    .msg-bubble-wrap {
      display: flex;
      justify-content: flex-start;
    }

    .msg-bubble-wrap.mine {
      justify-content: flex-end;
    }

    .msg-bubble-box {
      max-width: 65%;
      padding: 12px 16px;
      border-radius: 14px;
      background: #161b26;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    .msg-bubble-wrap.mine .msg-bubble-box {
      background: linear-gradient(135deg, #e50914, #b20710);
      border-color: rgba(229, 9, 20, 0.4);
      color: #fff;
    }

    .msg-content {
      font-size: 0.92rem;
      line-height: 1.45;
      margin: 0 0 4px;
      word-break: break-word;
    }

    .msg-timestamp {
      font-size: 0.68rem;
      color: #94a3b8;
      display: block;
      text-align: right;
    }

    .msg-bubble-wrap.mine .msg-timestamp {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Chat Input Bar */
    .chat-input-bar {
      padding: 16px 24px;
      background: #0e121a;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .message-form {
      display: flex;
      gap: 12px;
    }

    .message-input {
      flex: 1;
      background: #07090E;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px 16px;
      color: #ffffff;
      font-size: 0.95rem;
      outline: none;
    }

    .message-input:focus {
      border-color: #e50914;
    }

    .no-selection-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .no-selection-view .empty-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .no-selection-view h2 {
      color: #fff;
      margin-bottom: 8px;
    }

    @media (max-width: 800px) {
      .messages-layout {
        grid-template-columns: 1fr;
      }
      .contacts-sidebar {
        display: none;
      }
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  friendService = inject(FriendService);
  signalRService = inject(SignalRService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  friends: FriendDto[] = [];
  incomingRequests: FriendRequestDto[] = [];
  selectedFriend: FriendDto | null = null;
  messages: DirectMessageDto[] = [];

  searchUsername = '';
  draftMessage = '';
  isLoading = true;
  currentUserId = '';
  currentUsername = '';

  private subs = new Subscription();

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.currentUserId = user.id;
      this.currentUsername = user.username;
      this.initSignalR();
    }

    this.loadFriendsAndRequests();
  }

  initSignalR(): void {
    this.signalRService.startChatConnection(this.currentUserId).then(() => {
      console.log('Connected to chat SignalR hub');
    }).catch(err => {
      console.error('Chat SignalR connection failed', err);
    });

    this.subs.add(
      this.signalRService.directMessage$.subscribe(msg => {
        if (this.selectedFriend && (msg.senderId === this.selectedFriend.id || msg.targetUserId === this.selectedFriend.id)) {
          this.messages.push({
            id: msg.id,
            senderUserId: msg.senderId,
            receiverUserId: msg.targetUserId,
            message: msg.message,
            isMine: msg.senderId === this.currentUserId,
            createdAt: msg.timestamp
          });
          this.scrollToBottom();
        } else {
          this.toastService.info(`New message from @${msg.senderUsername}`);
        }
      })
    );
  }

  loadFriendsAndRequests(): void {
    this.isLoading = true;
    this.friendService.getFriendsAndRequests().subscribe({
      next: (res) => {
        this.friends = res.data?.friends || [];
        this.incomingRequests = res.data?.incomingRequests || [];
        this.isLoading = false;

        // Check query params if navigated to chat with someone
        const chatWithId = this.route.snapshot.queryParamMap.get('chatWith');
        if (chatWithId) {
          const found = this.friends.find(f => f.id === chatWithId);
          if (found) {
            this.selectFriend(found);
          }
        } else if (this.friends.length > 0 && !this.selectedFriend) {
          this.selectFriend(this.friends[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load friends roster', err);
        this.isLoading = false;
      }
    });
  }

  selectFriend(friend: FriendDto): void {
    this.selectedFriend = friend;
    this.loadMessages(friend.id);
  }

  loadMessages(friendId: string): void {
    this.friendService.getDirectMessages(friendId).subscribe({
      next: (res) => {
        this.messages = res.data || [];
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load direct messages', err);
      }
    });
  }

  sendMessage(e: Event): void {
    e.preventDefault();
    const text = this.draftMessage.trim();
    if (!text || !this.selectedFriend) return;

    const friendId = this.selectedFriend.id;
    this.friendService.sendDirectMessage(friendId, text).subscribe({
      next: (res) => {
        this.messages.push(res.data);
        this.draftMessage = '';
        this.scrollToBottom();
        // Also signal over SignalR
        this.signalRService.sendDirectMessage(this.currentUserId, this.currentUsername, friendId, text);
      },
      error: (err) => {
        this.toastService.error('Failed to send direct message.');
      }
    });
  }

  sendRequest(): void {
    const target = this.searchUsername.trim();
    if (!target) {
      this.toastService.warning('Please enter a username.');
      return;
    }

    this.friendService.sendFriendRequest(target).subscribe({
      next: () => {
        this.toastService.success(`Friend request sent to @${target}!`);
        this.searchUsername = '';
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Could not send friend request.');
      }
    });
  }

  respondRequest(requestId: string, accept: boolean): void {
    this.friendService.respondFriendRequest(requestId, accept).subscribe({
      next: (res) => {
        this.toastService.success(accept ? 'Friend request accepted!' : 'Friend request declined.');
        this.loadFriendsAndRequests();
      },
      error: (err) => {
        this.toastService.error('Failed to respond to request.');
      }
    });
  }

  formatTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatScroll) {
        this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.signalRService.stopChatConnection();
  }
}
