import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FriendDto {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface FriendRequestDto {
  id: string;
  senderUserId: string;
  senderUsername: string;
  createdAt: string;
}

export interface DirectMessageDto {
  id: string;
  senderUserId: string;
  receiverUserId: string;
  message: string;
  isMine: boolean;
  createdAt: string;
}

export interface OutgoingRequestDto {
  id: string;
  receiverUserId: string;
  receiverUsername: string;
  createdAt: string;
}

export interface FriendsResponse {
  friends: FriendDto[];
  incomingRequests: FriendRequestDto[];
  outgoingRequests?: OutgoingRequestDto[];
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/friends`;

  getFriendsAndRequests(): Observable<{ data: FriendsResponse; success: boolean; message: string }> {
    return this.http.get<{ data: FriendsResponse; success: boolean; message: string }>(this.apiUrl);
  }

  getFriendshipStatus(targetUsername: string): Observable<{ data: { status: 'None' | 'Friends' | 'PendingOutgoing' | 'PendingIncoming' | 'Self'; requestId?: string }; success: boolean; message: string }> {
    return this.http.get<{ data: { status: any; requestId?: string }; success: boolean; message: string }>(`${this.apiUrl}/status/${targetUsername}`);
  }

  sendFriendRequest(targetUsername: string): Observable<{ data: any; success: boolean; message: string }> {
    return this.http.post<{ data: any; success: boolean; message: string }>(`${this.apiUrl}/request/${targetUsername}`, {});
  }

  respondFriendRequest(requestId: string, accept: boolean): Observable<{ data: boolean; success: boolean; message: string }> {
    return this.http.post<{ data: boolean; success: boolean; message: string }>(`${this.apiUrl}/respond/${requestId}?accept=${accept}`, {});
  }

  getDirectMessages(friendId: string): Observable<{ data: DirectMessageDto[]; success: boolean; message: string }> {
    return this.http.get<{ data: DirectMessageDto[]; success: boolean; message: string }>(`${this.apiUrl}/messages/${friendId}`);
  }

  sendDirectMessage(friendId: string, message: string): Observable<{ data: DirectMessageDto; success: boolean; message: string }> {
    return this.http.post<{ data: DirectMessageDto; success: boolean; message: string }>(`${this.apiUrl}/messages/${friendId}`, { message });
  }
}

