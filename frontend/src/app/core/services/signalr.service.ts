import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoomMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface PlaybackSyncEvent {
  action: string;
  currentTime: number;
  videoUrl?: string;
  videoTitle?: string;
  serverTimestamp: string;
}

export interface DirectMessageEvent {
  id: string;
  senderId: string;
  senderUsername: string;
  targetUserId: string;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private partyHubConnection: signalR.HubConnection | null = null;
  private chatHubConnection: signalR.HubConnection | null = null;

  // Party Observables
  playbackSync$ = new Subject<PlaybackSyncEvent>();
  roomMessage$ = new Subject<RoomMessage>();
  roomReaction$ = new Subject<{ sender: string; emoji: string }>();
  roomMembers$ = new BehaviorSubject<string[]>([]);
  currentRoomState$ = new Subject<any>();
  screenShare$ = new Subject<{ isSharing: boolean; hostUsername: string }>();
  signalData$ = new Subject<any>();
  partyClosed$ = new Subject<any>();

  // Chat Observables
  directMessage$ = new Subject<DirectMessageEvent>();

  startPartyConnection(roomCode: string, username: string): Promise<void> {
    const hubUrl = environment.hubUrl ? `${environment.hubUrl}/watchparty` : 'http://localhost:5000/hubs/watchparty';

    this.partyHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.partyHubConnection.on('PlaybackSynced', (data: PlaybackSyncEvent) => {
      this.playbackSync$.next(data);
    });

    this.partyHubConnection.on('ReceiveRoomMessage', (msg: RoomMessage) => {
      this.roomMessage$.next(msg);
    });

    this.partyHubConnection.on('ReceiveRoomReaction', (reaction: { sender: string; emoji: string }) => {
      this.roomReaction$.next(reaction);
    });

    this.partyHubConnection.on('MemberJoined', (data: { username: string; members: string[] }) => {
      this.roomMembers$.next(data.members);
    });

    this.partyHubConnection.on('MemberLeft', (data: { username: string; members: string[] }) => {
      this.roomMembers$.next(data.members);
    });

    this.partyHubConnection.on('CurrentRoomState', (state: any) => {
      this.currentRoomState$.next(state);
    });

    this.partyHubConnection.on('ScreenShareToggled', (data: { isSharing: boolean; hostUsername: string }) => {
      this.screenShare$.next(data);
    });

    this.partyHubConnection.on('ReceiveSignalData', (data: any) => {
      this.signalData$.next(data);
    });

    this.partyHubConnection.on('PartyClosed', (data: any) => {
      this.partyClosed$.next(data);
    });

    return this.partyHubConnection.start().then(() => {
      this.partyHubConnection?.invoke('JoinParty', roomCode, username);
    });
  }

  sendPlaybackAction(roomCode: string, action: string, currentTime: number, videoUrl?: string, videoTitle?: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('SendPlaybackAction', roomCode, action, currentTime, videoUrl, videoTitle);
    }
  }

  sendRoomMessage(roomCode: string, sender: string, message: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('SendRoomMessage', roomCode, sender, message);
    }
  }

  sendRoomReaction(roomCode: string, sender: string, emoji: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('SendRoomReaction', roomCode, sender, emoji);
    }
  }

  sendScreenShareToggle(roomCode: string, isSharing: boolean, hostUsername: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('SendScreenShareToggle', roomCode, isSharing, hostUsername);
    }
  }

  sendSignalData(roomCode: string, signalData: any): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('SendSignalData', roomCode, signalData);
    }
  }

  closeParty(roomCode: string, username: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('CloseParty', roomCode, username);
    }
  }

  leaveParty(roomCode: string, username: string): void {
    if (this.partyHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.partyHubConnection.invoke('LeaveParty', roomCode, username).finally(() => {
        this.partyHubConnection?.stop();
        this.partyHubConnection = null;
      });
    }
  }

  startChatConnection(userId: string): Promise<void> {
    const hubUrl = environment.hubUrl ? `${environment.hubUrl}/chat` : 'http://localhost:5000/hubs/chat';

    this.chatHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.chatHubConnection.on('ReceiveDirectMessage', (msg: DirectMessageEvent) => {
      this.directMessage$.next(msg);
    });

    return this.chatHubConnection.start().then(() => {
      this.chatHubConnection?.invoke('RegisterUser', userId);
    });
  }

  sendDirectMessage(senderId: string, senderUsername: string, targetUserId: string, message: string): void {
    if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
      this.chatHubConnection.invoke('SendDirectMessage', senderId, senderUsername, targetUserId, message);
    }
  }

  stopChatConnection(): void {
    this.chatHubConnection?.stop();
    this.chatHubConnection = null;
  }
}
