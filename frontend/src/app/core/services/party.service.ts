import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WatchPartyDto {
  id: string;
  title: string;
  roomCode: string;
  hostUserId: string;
  hostUsername?: string;
  hostFullName?: string;
  hostAvatarUrl?: string;
  isPrivate: boolean;
  maxMembers: number;
  memberCount: number;
  status: string;
  createdAt: string;
  currentPlayback?: {
    isPlaying: boolean;
    currentSeconds: number;
    videoUrl?: string;
    videoTitle?: string;
    lastUpdatedBy?: string;
  };
}

export interface CreatePartyRequest {
  title: string;
  description?: string;
  videoSourceUrl?: string;
  mediaTitle?: string;
  isPrivate: boolean;
  passcode?: string;
  maxMembers: number;
}

@Injectable({
  providedIn: 'root'
})
export class PartyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/watchparties`;

  getActiveParties(): Observable<{ data: WatchPartyDto[]; success: boolean; message: string }> {
    return this.http.get<{ data: WatchPartyDto[]; success: boolean; message: string }>(this.apiUrl);
  }

  getPartyByCode(roomCode: string): Observable<{ data: WatchPartyDto; success: boolean; message: string }> {
    return this.http.get<{ data: WatchPartyDto; success: boolean; message: string }>(`${this.apiUrl}/${roomCode}`);
  }

  createParty(req: CreatePartyRequest): Observable<{ data: WatchPartyDto; success: boolean; message: string }> {
    return this.http.post<{ data: WatchPartyDto; success: boolean; message: string }>(this.apiUrl, req);
  }

  verifyPasscode(roomCode: string, passcode: string): Observable<{ data: boolean; success: boolean; message: string }> {
    return this.http.post<{ data: boolean; success: boolean; message: string }>(`${this.apiUrl}/${roomCode}/verify`, { passcode });
  }

  deleteParty(roomCode: string): Observable<{ data: boolean; success: boolean; message: string }> {
    return this.http.delete<{ data: boolean; success: boolean; message: string }>(`${this.apiUrl}/${roomCode}`);
  }
}
