import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SignalRService, RoomMessage, PlaybackSyncEvent } from '../../../../core/services/signalr.service';
import { PartyService, WatchPartyDto } from '../../../../core/services/party.service';
import { FriendService } from '../../../../core/services/friend.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

interface FloatingReaction {
  id: number;
  emoji: string;
  sender: string;
  left: number;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

@Component({
  selector: 'app-party-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="party-room-page">
      <!-- Floating Reactions Layer -->
      <div class="floating-reactions-container">
        <div 
          *ngFor="let r of floatingReactions" 
          class="floating-reaction-item"
          [style.left.%]="r.left">
          <span class="reaction-emoji">{{ r.emoji }}</span>
          <span class="reaction-sender">{{ r.sender }}</span>
        </div>
      </div>

      <!-- Top Room Navigation Bar -->
      <header class="room-nav">
        <div class="room-nav-left">
          <button (click)="leaveRoom()" class="back-btn" title="Leave Party">
            ← Exit
          </button>
          
          <div class="room-info">
            <h1 class="room-title">{{ party?.title || 'Watch Party Room' }}</h1>
            <div class="room-tags">
              <span class="room-code-badge" (click)="copyRoomCode()" title="Click to copy room code">
                #{{ roomCode }} 📋
              </span>
              <span class="live-tag">
                <span class="pulse-dot"></span> LIVE
              </span>
              <span *ngIf="party?.isPrivate" class="private-tag">🔒 PIN Protected</span>
            </div>
          </div>

          <!-- Host Badge & Quick Add Host Action -->
          <div class="host-pill-banner">
            <span class="crown-icon">👑</span>
            <span class="host-label">Host:</span>
            <strong class="host-name">&#64;{{ party?.hostUsername || 'Host' }}</strong>

            <ng-container *ngIf="!isHost && party?.hostUsername">
              <!-- If already friends, do NOT show + Add Host -->
              <span *ngIf="isFriend(party?.hostUsername)" class="host-friends-tag" title="You are friends with the host">
                🤝 Friends
              </span>
              <!-- If friend request pending -->
              <span *ngIf="!isFriend(party?.hostUsername) && isPendingFriend(party?.hostUsername)" class="host-pending-tag" title="Friend request is pending">
                ⏳ Requested
              </span>
              <!-- If NOT friends, show + Add Host button -->
              <button 
                *ngIf="!isFriend(party?.hostUsername) && !isPendingFriend(party?.hostUsername)"
                (click)="addFriend(party?.hostUsername)" 
                class="btn btn-sm btn-host-add"
                id="btn-add-host-friend"
                title="Send Friend Request to Host">
                ➕ Add Host
              </button>
              <a 
                [routerLink]="['/messages']" 
                [queryParams]="{ chatWith: party?.hostUserId, username: party?.hostUsername }"
                class="btn btn-sm btn-host-dm"
                title="Send Private Message to Host">
                💬 DM
              </a>
            </ng-container>
          </div>
        </div>

        <div class="room-nav-right">
          <div class="members-pill" (click)="toggleSidebarTab('members')">
            <span>👥</span>
            <span>{{ members.length }} Online</span>
          </div>

          <button (click)="copyInviteLink()" class="btn btn-outline btn-sm" id="btn-copy-invite">
            Share Link 🔗
          </button>

          <!-- Host Delete Party Button -->
          <button 
            *ngIf="isHost" 
            (click)="endParty()" 
            class="btn btn-danger btn-sm" 
            id="btn-delete-party"
            title="End and permanently delete this watch party session">
            🗑️ End & Delete Party
          </button>
        </div>
      </header>

      <!-- Main Stage Layout: Player + Live Sidebar -->
      <div class="stage-container">
        <!-- Center/Left: Cinema Screen & Controls -->
        <main class="cinema-stage">
          <div class="screen-viewport" [class.sharing-active]="isScreenSharingActive">
            <!-- Mode 1: Live Browser Screen Share (Host & Viewers via WebRTC) -->
            <div *ngIf="isScreenSharingActive" class="screen-share-view">
              <video #screenShareVideo autoplay playsinline class="screen-video-elem"></video>
              <div class="screen-share-overlay">
                <span class="screen-badge">
                  🔴 LIVE SCREEN SHARE: {{ screenShareHost }}
                </span>
                <span *ngIf="!isHost" class="webrtc-tag">
                  ⚡ WebRTC Synced
                </span>
                <button *ngIf="isHost" (click)="stopScreenShare()" class="btn btn-sm btn-danger">
                  ⏹️ Stop Screen Share
                </button>
                <button *ngIf="!isHost && !remoteScreenStream" (click)="requestScreenStreamFromHost()" class="btn btn-sm btn-outline">
                  🔄 Reconnect Stream
                </button>
              </div>
            </div>

            <!-- Mode 2: Synchronized Video Stream (YouTube / Direct Video) -->
            <div *ngIf="!isScreenSharingActive" class="video-stream-view">
              <!-- YouTube Embed (ONLY when isYouTubeVideo is true AND safeYouTubeUrl is set) -->
              <iframe 
                *ngIf="isYouTubeVideo && safeYouTubeUrl" 
                [src]="safeYouTubeUrl" 
                class="stream-iframe"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
              </iframe>

              <!-- Direct Video / MP4 Stream -->
              <video 
                *ngIf="!isYouTubeVideo && currentVideoUrl" 
                #htmlVideoPlayer 
                [src]="currentVideoUrl" 
                controls 
                class="direct-video-player"
                (play)="onDirectPlay()"
                (pause)="onDirectPause()"
                (seeked)="onDirectSeek()">
              </video>

              <!-- Cinema Stage Waiting / Start Screen (When no stream is actively playing) -->
              <div *ngIf="(!isYouTubeVideo || !safeYouTubeUrl) && !currentVideoUrl" class="player-empty-state">
                <div class="empty-cinema-glow"></div>
                <div class="empty-cinema-icon">🎬</div>
                <h2 class="empty-cinema-title">Cinema Screen is Ready</h2>
                <p class="empty-cinema-subtitle" *ngIf="isHost">
                  Start streaming your screen from any platform (JioHotstar, Netflix, Prime, YouTube) or enter a video link to watch together with friends.
                </p>
                <p class="empty-cinema-subtitle" *ngIf="!isHost">
                  Waiting for host <strong>&#64;{{ party?.hostUsername || 'Host' }}</strong> to start streaming or select a video. Say hello in the live chat!
                </p>

                <div class="empty-stage-actions" *ngIf="isHost">
                  <button (click)="startScreenShare()" class="btn btn-primary btn-lg" id="btn-empty-start-screenshare">
                    🖥️ Share Screen / OTT Tab Now
                  </button>
                  <button (click)="showVideoInput = true" class="btn btn-outline btn-lg" id="btn-empty-enter-url">
                    🔗 Play a Video / YouTube Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Cinema Controls & Screen Share Toolbar -->
          <div class="stage-toolbar">
            <div class="toolbar-left">
              <!-- Screen Share Toggle -->
              <button 
                *ngIf="!isScreenSharingActive" 
                (click)="startScreenShare()" 
                class="btn btn-accent btn-sm"
                id="btn-share-screen"
                title="Share any OTT window or browser tab with full video and audio">
                🖥️ Share Screen / OTT Tab
              </button>
              <button 
                *ngIf="isScreenSharingActive && isHost" 
                (click)="stopScreenShare()" 
                class="btn btn-danger btn-sm"
                id="btn-stop-share-screen">
                ⏹️ Stop Sharing
              </button>

              <!-- Video URL Switcher Modal / Popover -->
              <button (click)="showVideoInput = !showVideoInput" class="btn btn-outline btn-sm">
                🔗 {{ showVideoInput ? 'Hide URL' : 'Change Video URL' }}
              </button>
            </div>

            <!-- Quick Emoji Reactions Bar -->
            <div class="reactions-bar">
              <span class="react-label">React Live:</span>
              <button *ngFor="let emoji of availableEmojis" (click)="sendReaction(emoji)" class="reaction-btn" [title]="'React ' + emoji">
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Video URL Config Input (Host/Presenter) -->
          <div *ngIf="showVideoInput" class="video-input-panel">
            <div class="url-input-wrap">
              <span class="url-icon">🌐</span>
              <input 
                type="text" 
                [(ngModel)]="newVideoInputUrl" 
                placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=Way9Dexny3w) or MP4 URL"
                class="url-input"
                id="input-change-video-url"
              />
              <button (click)="applyVideoSource()" class="btn btn-primary btn-sm" id="btn-sync-video-stream">
                Sync with Room
              </button>
            </div>
            <div class="preset-links">
              <span>Quick Trailers:</span>
              <button (click)="setPresetUrl('https://www.youtube.com/watch?v=Way9Dexny3w')" class="preset-btn">Dune Part Two</button>
              <button (click)="setPresetUrl('https://www.youtube.com/watch?v=sBEvEcpnG7k')" class="preset-btn">Stranger Things 4</button>
              <button (click)="setPresetUrl('https://www.youtube.com/watch?v=17dQw_gNqps')" class="preset-btn">Pushpa 2 Trailer</button>
            </div>
          </div>
        </main>

        <!-- Right Side: Live Chat & Attendees Sidebar -->
        <aside class="party-sidebar">
          <!-- Sidebar Tabs -->
          <div class="sidebar-tabs">
            <button 
              class="side-tab-btn" 
              [class.active]="activeSidebarTab === 'chat'"
              (click)="toggleSidebarTab('chat')">
              💬 Live Chat
            </button>
            <button 
              class="side-tab-btn" 
              [class.active]="activeSidebarTab === 'members'"
              (click)="toggleSidebarTab('members')">
              👥 Attendees ({{ members.length }})
            </button>
          </div>

          <!-- TAB 1: Real-time Live Chat Panel -->
          <div *ngIf="activeSidebarTab === 'chat'" class="chat-container">
            <div class="chat-messages" #chatScroll>
              <div *ngIf="messages.length === 0" class="chat-empty">
                <span>👋</span>
                <p>Welcome to the watch party! Say hello to everyone or share reactions.</p>
              </div>

              <div *ngFor="let msg of messages" class="chat-message-row" [class.my-message]="msg.sender === currentUsername">
                <div class="msg-avatar">
                  {{ msg.sender.charAt(0).toUpperCase() }}
                </div>
                <div class="msg-bubble">
                  <div class="msg-header">
                    <span class="msg-sender">{{ msg.sender }}</span>
                    <span *ngIf="msg.sender === party?.hostUserId || msg.sender === party?.hostUsername" class="host-pill">HOST</span>
                    <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                  <div class="msg-text">{{ msg.message }}</div>
                </div>
              </div>
            </div>

            <!-- Chat Input Form -->
            <div class="chat-footer">
              <form (submit)="sendMessage($event)" class="chat-form">
                <input 
                  type="text" 
                  [(ngModel)]="chatDraft" 
                  name="chatDraft" 
                  placeholder="Type a message or comment..." 
                  class="chat-input"
                  id="input-party-chat"
                  autocomplete="off"
                />
                <button type="submit" class="btn btn-primary btn-icon" id="btn-send-chat" [disabled]="!chatDraft.trim()">
                  ➤
                </button>
              </form>
            </div>
          </div>

          <!-- TAB 2: Attendees List Panel with Social Friend Actions -->
          <div *ngIf="activeSidebarTab === 'members'" class="members-container">
            <div class="members-list">
              <div *ngFor="let member of members" class="member-item">
                <div class="member-avatar">
                  {{ member.charAt(0).toUpperCase() }}
                </div>
                <div class="member-name">
                  <span class="m-text">{{ member }}</span>
                  <span *ngIf="member === currentUsername" class="you-pill">You</span>
                  <span *ngIf="member === party?.hostUserId || member === party?.hostUsername" class="host-pill">HOST</span>
                </div>

                <!-- Add Friend / Message Buttons for other members -->
                <div class="member-actions" *ngIf="member !== currentUsername">
                  <span *ngIf="isFriend(member)" class="member-friends-tag" title="Already friends">
                    🤝 Friends
                  </span>
                  <span *ngIf="!isFriend(member) && isPendingFriend(member)" class="member-pending-tag" title="Friend request pending">
                    ⏳ Pending
                  </span>
                  <button 
                    *ngIf="!isFriend(member) && !isPendingFriend(member)"
                    (click)="addFriend(member)" 
                    class="btn btn-icon-sm" 
                    title="Send Friend Request">
                    ➕ Add
                  </button>
                  <a 
                    [routerLink]="['/messages']" 
                    [queryParams]="{ username: member }" 
                    class="btn btn-icon-sm" 
                    title="Send Direct Message">
                    💬
                  </a>
                </div>

                <div class="online-indicator"></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .party-room-page {
      min-height: calc(100vh - 70px);
      background: #07090E;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow-x: hidden;
    }

    /* Floating Reactions */
    .floating-reactions-container {
      position: fixed;
      bottom: 90px;
      left: 0;
      right: 360px;
      height: 400px;
      pointer-events: none;
      overflow: hidden;
      z-index: 1000;
    }

    .floating-reaction-item {
      position: absolute;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: floatUp 3s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
    }

    .reaction-emoji {
      font-size: 2.2rem;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }

    .reaction-sender {
      font-size: 0.7rem;
      font-weight: 700;
      color: #ffffff;
      background: rgba(0,0,0,0.7);
      padding: 2px 6px;
      border-radius: 6px;
    }

    /* Top Room Nav */
    .room-nav {
      min-height: 64px;
      background: #0B0E14;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 24px;
      gap: 16px;
      z-index: 10;
      flex-wrap: wrap;
    }

    .room-nav-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: rgba(229, 9, 20, 0.2);
      border-color: #e50914;
    }

    .room-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .room-title {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }

    .room-tags {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .room-code-badge {
      font-family: monospace;
      background: rgba(255, 255, 255, 0.08);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .room-code-badge:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    .live-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(229, 9, 20, 0.2);
      border: 1px solid rgba(229, 9, 20, 0.4);
      color: #ff4d52;
      font-size: 0.72rem;
      font-weight: 800;
      border-radius: 999px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #e50914;
      animation: pulse 1s infinite;
    }

    .private-tag {
      font-size: 0.75rem;
      padding: 2px 8px;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-radius: 999px;
    }

    .host-pill-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.82rem;
    }

    .crown-icon { font-size: 0.95rem; }
    .host-label { color: #94a3b8; }
    .host-name { color: #818cf8; }

    .host-friends-tag {
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .host-pending-tag {
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .member-friends-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .member-pending-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn-host-add {
      background: #e50914;
      color: #fff;
      border: none;
      padding: 2px 8px;
      font-size: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
    }

    .btn-host-dm {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      font-size: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
    }

    .room-nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .members-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      cursor: pointer;
    }

    /* Stage Layout */
    .stage-container {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 360px;
      min-height: calc(100vh - 134px);
    }

    /* Cinema Stage */
    .cinema-stage {
      display: flex;
      flex-direction: column;
      background: #000000;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    .screen-viewport {
      flex: 1;
      min-height: 480px;
      background: #05070a;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .screen-share-view, .video-stream-view {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .screen-video-elem {
      width: 100%;
      height: 100%;
      max-height: calc(100vh - 200px);
      object-fit: contain;
      background: #000;
    }

    .screen-share-overlay {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 5;
    }

    .screen-badge {
      background: rgba(229, 9, 20, 0.9);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .webrtc-tag {
      background: rgba(16, 185, 129, 0.85);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .stream-iframe {
      width: 100%;
      height: 100%;
      min-height: 520px;
    }

    .direct-video-player {
      width: 100%;
      height: 100%;
      max-height: calc(100vh - 200px);
      background: #000;
    }

    .player-empty-state {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
    }

    .empty-cinema-icon {
      font-size: 3.5rem;
      margin-bottom: 12px;
    }

    /* Toolbar */
    .stage-toolbar {
      background: #0d1117;
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-accent {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      border: none;
      font-weight: 700;
    }

    .reactions-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .react-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .reaction-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .reaction-btn:hover {
      transform: scale(1.25);
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Video Input Panel */
    .video-input-panel {
      background: #131823;
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .url-input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .url-input {
      flex: 1;
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      font-size: 0.88rem;
      outline: none;
    }

    .preset-links {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .preset-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
    }

    /* Live Chat Sidebar */
    .party-sidebar {
      background: #0B0E14;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .sidebar-tabs {
      display: flex;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .side-tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .side-tab-btn.active {
      color: #ffffff;
      border-bottom: 2px solid #e50914;
      background: rgba(255, 255, 255, 0.02);
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 180px);
    }

    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-empty {
      text-align: center;
      color: #64748b;
      margin: auto 0;
      font-size: 0.88rem;
    }

    .chat-empty span {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }

    .chat-message-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .msg-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      color: #e2e8f0;
      flex-shrink: 0;
    }

    .my-message .msg-avatar { background: #e50914; }

    .msg-bubble {
      background: #161b26;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 8px 12px;
      max-width: 85%;
    }

    .my-message .msg-bubble {
      background: rgba(229, 9, 20, 0.15);
      border-color: rgba(229, 9, 20, 0.3);
    }

    .msg-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .msg-sender {
      font-size: 0.82rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .host-pill {
      font-size: 0.65rem;
      font-weight: 800;
      background: #e50914;
      color: #fff;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .you-pill {
      font-size: 0.65rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .msg-time {
      font-size: 0.7rem;
      color: #64748b;
      margin-left: auto;
    }

    .msg-text {
      font-size: 0.88rem;
      color: #cbd5e1;
      line-height: 1.4;
      word-break: break-word;
    }

    .chat-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: #0d1117;
    }

    .chat-form {
      display: flex;
      gap: 8px;
    }

    .chat-input {
      flex: 1;
      background: #0B0E14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      font-size: 0.88rem;
      outline: none;
    }

    .chat-input:focus { border-color: #e50914; }

    /* Members Tab */
    .members-container {
      padding: 16px;
      overflow-y: auto;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
      margin-bottom: 8px;
      transition: background 0.15s;
    }

    .member-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .member-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e50914, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .member-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      flex: 1;
      overflow: hidden;
    }

    .m-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-actions {
      display: flex;
      gap: 4px;
    }

    .btn-icon-sm {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s;
    }

    .btn-icon-sm:hover {
      background: rgba(229, 9, 20, 0.2);
      border-color: #e50914;
      color: #fff;
    }

    .online-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      flex-shrink: 0;
    }

    @keyframes floatUp {
      0% { opacity: 0; transform: translateY(0) scale(0.6); }
      20% { opacity: 1; transform: translateY(-40px) scale(1.1); }
      80% { opacity: 0.9; transform: translateY(-240px) scale(1); }
      100% { opacity: 0; transform: translateY(-340px) scale(0.8); }
    }

    @media (max-width: 960px) {
      .stage-container { grid-template-columns: 1fr; }
      .party-sidebar { height: 400px; }
      .floating-reactions-container { right: 0; }
    }
  `]
})
export class PartyRoomComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  sanitizer = inject(DomSanitizer);
  signalRService = inject(SignalRService);
  partyService = inject(PartyService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('screenShareVideo') screenShareVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('htmlVideoPlayer') htmlVideoPlayer?: ElementRef<HTMLVideoElement>;

  roomCode = '';
  party: WatchPartyDto | null = null;
  currentUsername = 'Guest_' + Math.floor(Math.random() * 899 + 100);
  isHost = false;

  // Media state
  currentVideoUrl = '';
  safeYouTubeUrl: SafeResourceUrl | null = null;
  isYouTubeVideo = false;
  newVideoInputUrl = '';
  showVideoInput = false;

  // Screen Share & WebRTC state
  isScreenSharingActive = false;
  screenShareHost = '';
  localScreenStream: MediaStream | null = null;
  peerConnections: { [viewerUsername: string]: RTCPeerConnection } = {};
  remotePeerConnection: RTCPeerConnection | null = null;
  remoteScreenStream: MediaStream | null = null;

  // Real-time Chat & Attendees
  messages: RoomMessage[] = [];
  members: string[] = [];
  chatDraft = '';
  activeSidebarTab: 'chat' | 'members' = 'chat';

  // Social & Friend states
  friendUsernames = new Set<string>();
  pendingFriendUsernames = new Set<string>();

  // Floating Reactions
  availableEmojis = ['❤️', '🔥', '😂', '👏', '🍿', '🎬', '🚀'];
  floatingReactions: FloatingReaction[] = [];
  private reactionCounter = 0;

  private subs = new Subscription();

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('roomCode')?.toUpperCase() || '';

    this.authService.currentUser$.subscribe(u => {
      if (u?.username) {
        this.currentUsername = u.username;
        this.loadFriendStatus();
      }
    });

    if (this.authService.isAuthenticated) {
      this.loadFriendStatus();
    }

    this.loadPartyDetails();
  }

  loadPartyDetails(): void {
    this.partyService.getPartyByCode(this.roomCode).subscribe({
      next: (res) => {
        this.party = res.data;
        const current = this.authService.currentUser;
        this.isHost = this.party.hostUserId === this.currentUsername ||
          current?.id === this.party.hostUserId ||
          current?.username?.toLowerCase() === this.party.hostUsername?.toLowerCase();

        if (this.party.currentPlayback?.videoUrl && this.party.currentPlayback.videoUrl.trim() !== '') {
          this.setVideoSource(this.party.currentPlayback.videoUrl);
        }

        this.initSignalR();
      },
      error: (err) => {
        this.toastService.error('Failed to load watch party room.');
        this.router.navigate(['/watch-parties']);
      }
    });
  }

  initSignalR(): void {
    this.signalRService.startPartyConnection(this.roomCode, this.currentUsername).then(() => {
      console.log('Connected to party SignalR hub');
      // If viewer joins, request screen stream in case host is already sharing
      if (!this.isHost) {
        setTimeout(() => this.requestScreenStreamFromHost(), 1000);
      }
    }).catch(err => {
      console.error('SignalR party connection error', err);
    });

    // Chat messages
    this.subs.add(
      this.signalRService.roomMessage$.subscribe(msg => {
        this.messages.push(msg);
        this.scrollToBottom();
      })
    );

    // Live Reactions
    this.subs.add(
      this.signalRService.roomReaction$.subscribe(react => {
        this.spawnFloatingReaction(react.emoji, react.sender);
      })
    );

    // Members list updates
    this.subs.add(
      this.signalRService.roomMembers$.subscribe(memList => {
        this.members = memList;
        // If host is actively sharing screen, send offer to newly joined members
        if (this.isHost && this.localScreenStream) {
          memList.forEach(m => {
            if (m !== this.currentUsername && !this.peerConnections[m]) {
              this.createOfferForViewer(m);
            }
          });
        }
      })
    );

    // Playback sync
    this.subs.add(
      this.signalRService.playbackSync$.subscribe(event => {
        this.handlePlaybackSync(event);
      })
    );

    // Current room state when joining
    this.subs.add(
      this.signalRService.currentRoomState$.subscribe(state => {
        if (state) {
          if (state.isScreenSharing) {
            this.isScreenSharingActive = true;
            this.screenShareHost = state.hostUsername || 'Host';
            if (!this.isHost) {
              this.requestScreenStreamFromHost(state.hostUsername);
            }
          }
          if (state.videoUrl) {
            this.setVideoSource(state.videoUrl);
          }
        }
      })
    );

    // Screen Share Toggle
    this.subs.add(
      this.signalRService.screenShare$.subscribe(data => {
        this.isScreenSharingActive = data.isSharing;
        this.screenShareHost = data.hostUsername;
        if (data.isSharing) {
          if (!this.isHost) {
            this.requestScreenStreamFromHost(data.hostUsername);
          }
        } else {
          if (this.localScreenStream) {
            this.stopLocalMediaTracks();
          }
          this.cleanupRemotePeer();
        }
      })
    );

    // WebRTC Signal Data exchange
    this.subs.add(
      this.signalRService.signalData$.subscribe(data => {
        this.handleSignalData(data);
      })
    );

    // Party ended / closed by host
    this.subs.add(
      this.signalRService.partyClosed$.subscribe(data => {
        this.toastService.warning(data?.message || 'The host has ended this watch party.');
        this.cleanupRemotePeer();
        this.stopLocalMediaTracks();
        this.router.navigate(['/watch-parties']);
      })
    );
  }

  // --- WebRTC SCREEN SHARING IMPLEMENTATION ---
  async startScreenShare(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        this.toastService.warning('Screen sharing is not supported by your current browser.');
        return;
      }

      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      this.isScreenSharingActive = true;
      this.screenShareHost = this.currentUsername;

      setTimeout(() => {
        if (this.screenShareVideo?.nativeElement && this.localScreenStream) {
          this.screenShareVideo.nativeElement.srcObject = this.localScreenStream;
          this.screenShareVideo.nativeElement.play().catch(() => { });
        }
      }, 100);

      this.localScreenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Notify room via SignalR
      this.signalRService.sendScreenShareToggle(this.roomCode, true, this.currentUsername);
      this.signalRService.sendSignalData(this.roomCode, { type: 'screen-share-ready', host: this.currentUsername });

      // Create WebRTC offers for all currently connected members
      this.members.forEach(member => {
        if (member !== this.currentUsername) {
          this.createOfferForViewer(member);
        }
      });

      this.toastService.success('Screen sharing started! All attendees can now see your screen in real time.');
    } catch (err: any) {
      console.warn('Screen share cancelled or failed', err);
      if (err.name !== 'NotAllowedError') {
        this.toastService.error('Could not start screen sharing.');
      }
    }
  }

  async createOfferForViewer(viewer: string): Promise<void> {
    if (!this.localScreenStream) return;
    try {
      if (this.peerConnections[viewer]) {
        this.peerConnections[viewer].close();
      }

      const pc = new RTCPeerConnection(rtcConfig);
      this.peerConnections[viewer] = pc;

      this.localScreenStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localScreenStream!);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.signalRService.sendSignalData(this.roomCode, {
            type: 'candidate',
            candidate: event.candidate,
            target: viewer,
            sender: this.currentUsername
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.signalRService.sendSignalData(this.roomCode, {
        type: 'offer',
        sdp: offer,
        target: viewer,
        sender: this.currentUsername
      });
    } catch (err) {
      console.error('Error creating WebRTC offer for viewer', viewer, err);
    }
  }

  handleSignalData(data: any): void {
    if (!data) return;

    if (this.isHost) {
      // Host receives viewer request or viewer answer/candidate
      if (data.type === 'request-screen-stream' && data.viewer && this.localScreenStream) {
        this.createOfferForViewer(data.viewer);
      } else if (data.type === 'answer' && data.target === this.currentUsername && data.sender) {
        const pc = this.peerConnections[data.sender];
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).catch(e => console.error('Error setting remote answer', e));
        }
      } else if (data.type === 'candidate' && data.target === this.currentUsername && data.sender) {
        const pc = this.peerConnections[data.sender];
        if (pc && data.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error('Error adding ICE candidate', e));
        }
      }
    } else {
      // Viewer receives host offer or candidate
      if (data.type === 'screen-share-ready') {
        this.isScreenSharingActive = true;
        this.screenShareHost = data.host;
        this.requestScreenStreamFromHost(data.host);
      } else if (data.type === 'offer' && data.target === this.currentUsername) {
        this.handleOfferFromHost(data.sender, data.sdp);
      } else if (data.type === 'candidate' && data.target === this.currentUsername) {
        if (this.remotePeerConnection && data.candidate) {
          this.remotePeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error('Error adding ICE candidate', e));
        }
      } else if (data.type === 'screen-share-ended') {
        this.cleanupRemotePeer();
      }
    }
  }

  async handleOfferFromHost(host: string, sdp: any): Promise<void> {
    try {
      this.cleanupRemotePeer();
      this.isScreenSharingActive = true;
      this.screenShareHost = host;

      const pc = new RTCPeerConnection(rtcConfig);
      this.remotePeerConnection = pc;

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteScreenStream = event.streams[0];
          this.attachRemoteStream();
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.signalRService.sendSignalData(this.roomCode, {
            type: 'candidate',
            candidate: event.candidate,
            target: host,
            sender: this.currentUsername
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.signalRService.sendSignalData(this.roomCode, {
        type: 'answer',
        sdp: answer,
        target: host,
        sender: this.currentUsername
      });
    } catch (err) {
      console.error('Error handling WebRTC offer from host', err);
    }
  }

  attachRemoteStream(): void {
    setTimeout(() => {
      if (this.screenShareVideo?.nativeElement && this.remoteScreenStream) {
        this.screenShareVideo.nativeElement.srcObject = this.remoteScreenStream;
        this.screenShareVideo.nativeElement.play().catch(e => console.warn('Autoplay prevented', e));
      }
    }, 100);
  }

  requestScreenStreamFromHost(hostUsername?: string): void {
    this.signalRService.sendSignalData(this.roomCode, {
      type: 'request-screen-stream',
      viewer: this.currentUsername,
      host: hostUsername || this.party?.hostUsername
    });
  }

  stopScreenShare(): void {
    this.stopLocalMediaTracks();
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.peerConnections = {};
    this.isScreenSharingActive = false;
    this.signalRService.sendScreenShareToggle(this.roomCode, false, this.currentUsername);
    this.signalRService.sendSignalData(this.roomCode, { type: 'screen-share-ended', host: this.currentUsername });
    this.toastService.info('Screen sharing ended.');
  }

  private stopLocalMediaTracks(): void {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;
    }
  }

  cleanupRemotePeer(): void {
    if (this.remotePeerConnection) {
      this.remotePeerConnection.close();
      this.remotePeerConnection = null;
    }
    this.remoteScreenStream = null;
    this.isScreenSharingActive = false;
    if (this.screenShareVideo?.nativeElement) {
      this.screenShareVideo.nativeElement.srcObject = null;
    }
  }

  // --- HOST DELETE PARTY ---
  endParty(): void {
    if (!this.isHost) return;
    if (!confirm('Are you sure you want to end and delete this watch party? All attendees will be redirected.')) {
      return;
    }

    this.partyService.deleteParty(this.roomCode).subscribe({
      next: () => {
        this.signalRService.closeParty(this.roomCode, this.currentUsername);
        this.toastService.success('Watch party ended and deleted.');
        this.router.navigate(['/watch-parties']);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete watch party.');
      }
    });
  }

  // --- SOCIAL FRIEND REQUEST & RELATIONSHIP STATUS ---
  loadFriendStatus(): void {
    if (!this.authService.isAuthenticated) return;
    this.friendService.getFriendsAndRequests().subscribe({
      next: (res) => {
        if (res?.data?.friends) {
          res.data.friends.forEach(f => {
            if (f.username) this.friendUsernames.add(f.username.toLowerCase());
          });
        }
        if (res?.data?.outgoingRequests) {
          res.data.outgoingRequests.forEach(r => {
            if (r.receiverUsername) this.pendingFriendUsernames.add(r.receiverUsername.toLowerCase());
          });
        }
      },
      error: (err) => {
        console.warn('Could not load friend relationships', err);
      }
    });
  }

  isFriend(username?: string | null): boolean {
    if (!username) return false;
    const lower = username.toLowerCase();
    return lower === this.currentUsername.toLowerCase() || this.friendUsernames.has(lower);
  }

  isPendingFriend(username?: string | null): boolean {
    if (!username) return false;
    return this.pendingFriendUsernames.has(username.toLowerCase());
  }

  addFriend(targetUsername?: string): void {
    if (!targetUsername || targetUsername === this.currentUsername) return;
    const uname = targetUsername.toLowerCase();
    if (this.friendUsernames.has(uname)) {
      this.toastService.info(`You are already friends with @${targetUsername}!`);
      return;
    }
    if (this.pendingFriendUsernames.has(uname)) {
      this.toastService.info(`Friend request to @${targetUsername} is already pending.`);
      return;
    }
    if (!this.authService.isAuthenticated) {
      this.toastService.warning('Please sign in to send friend requests.');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.friendService.sendFriendRequest(targetUsername).subscribe({
      next: () => {
        this.pendingFriendUsernames.add(uname);
        this.toastService.success(`Friend request sent to @${targetUsername}!`);
      },
      error: (err) => {
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('already friends')) {
          this.friendUsernames.add(uname);
          this.toastService.info(`You are already friends with @${targetUsername}.`);
        } else if (msg.toLowerCase().includes('already pending') || msg.toLowerCase().includes('pending')) {
          this.pendingFriendUsernames.add(uname);
          this.toastService.info(`Friend request to @${targetUsername} is already pending.`);
        } else {
          this.toastService.warning(msg || 'Could not send friend request.');
        }
      }
    });
  }

  // --- VIDEO SOURCE & PLAYBACK SYNC ---
  setVideoSource(url: string): void {
    if (!url || !url.trim()) {
      this.currentVideoUrl = '';
      this.newVideoInputUrl = '';
      this.isYouTubeVideo = false;
      this.safeYouTubeUrl = null;
      return;
    }
    this.currentVideoUrl = url;
    this.newVideoInputUrl = url;

    const ytId = this.extractYouTubeId(url);
    if (ytId) {
      this.isYouTubeVideo = true;
      const embed = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1`;
      this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    } else {
      this.isYouTubeVideo = false;
      this.safeYouTubeUrl = null;
    }
  }

  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  applyVideoSource(): void {
    if (!this.newVideoInputUrl.trim()) return;
    this.setVideoSource(this.newVideoInputUrl.trim());
    this.showVideoInput = false;

    this.signalRService.sendPlaybackAction(this.roomCode, 'change-video', 0, this.currentVideoUrl, 'Video Stream');
    this.toastService.success('Stream synchronized with all attendees!');
  }

  setPresetUrl(url: string): void {
    this.newVideoInputUrl = url;
    this.applyVideoSource();
  }

  onDirectPlay(): void {
    const time = this.htmlVideoPlayer?.nativeElement.currentTime || 0;
    this.signalRService.sendPlaybackAction(this.roomCode, 'play', time);
  }

  onDirectPause(): void {
    const time = this.htmlVideoPlayer?.nativeElement.currentTime || 0;
    this.signalRService.sendPlaybackAction(this.roomCode, 'pause', time);
  }

  onDirectSeek(): void {
    const time = this.htmlVideoPlayer?.nativeElement.currentTime || 0;
    this.signalRService.sendPlaybackAction(this.roomCode, 'seek', time);
  }

  handlePlaybackSync(event: PlaybackSyncEvent): void {
    if (event.videoUrl && event.videoUrl !== this.currentVideoUrl) {
      this.setVideoSource(event.videoUrl);
    }

    if (this.htmlVideoPlayer && !this.isYouTubeVideo) {
      const vid = this.htmlVideoPlayer.nativeElement;
      if (Math.abs(vid.currentTime - event.currentTime) > 1.5) {
        vid.currentTime = event.currentTime;
      }
      if (event.action === 'play' && vid.paused) {
        vid.play().catch(() => { });
      } else if (event.action === 'pause' && !vid.paused) {
        vid.pause();
      }
    }
  }

  // --- FLOATING REACTIONS ---
  sendReaction(emoji: string): void {
    this.signalRService.sendRoomReaction(this.roomCode, this.currentUsername, emoji);
    this.spawnFloatingReaction(emoji, this.currentUsername);
  }

  spawnFloatingReaction(emoji: string, sender: string): void {
    const reactionId = ++this.reactionCounter;
    const left = Math.floor(Math.random() * 75) + 10;
    const reaction: FloatingReaction = { id: reactionId, emoji, sender, left };

    this.floatingReactions.push(reaction);

    setTimeout(() => {
      this.floatingReactions = this.floatingReactions.filter(r => r.id !== reactionId);
    }, 3200);
  }

  // --- LIVE CHAT ---
  sendMessage(e: Event): void {
    e.preventDefault();
    const text = this.chatDraft.trim();
    if (!text) return;

    this.signalRService.sendRoomMessage(this.roomCode, this.currentUsername, text);
    this.chatDraft = '';
  }

  toggleSidebarTab(tab: 'chat' | 'members'): void {
    this.activeSidebarTab = tab;
  }

  formatTime(isoTime: string): string {
    try {
      const d = new Date(isoTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.roomCode);
    this.toastService.success(`Copied room code: ${this.roomCode}`);
  }

  copyInviteLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    this.toastService.success('Party invite link copied to clipboard!');
  }

  leaveRoom(): void {
    this.signalRService.leaveParty(this.roomCode, this.currentUsername);
    this.cleanupRemotePeer();
    this.stopLocalMediaTracks();
    this.router.navigate(['/watch-parties']);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatScroll) {
        this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.cleanupRemotePeer();
    this.stopLocalMediaTracks();
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.subs.unsubscribe();
    this.signalRService.leaveParty(this.roomCode, this.currentUsername);
  }
}
