import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserBadgeDto {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface UserProfileDto {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  roles: string[];
  createdAt: string;
  stats: {
    totalWatchTimeMinutes: number;
    showsCompleted: number;
    moviesWatched: number;
    reviewsWritten: number;
    reputationScore: number;
  };
  badges: UserBadgeDto[];
  hostedPartiesCount: number;
  hostedParties: Array<{
    id: string;
    title: string;
    roomCode: string;
    status: string;
    memberCount: number;
    createdAt: string;
  }>;
}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUserProfile(username: string): Observable<{ data: UserProfileDto; success: boolean; message: string }> {
    return this.http.get<{ data: UserProfileDto; success: boolean; message: string }>(`${this.apiUrl}/${username}`);
  }

  updateProfile(req: UpdateProfileRequest): Observable<{ data: any; success: boolean; message: string }> {
    return this.http.put<{ data: any; success: boolean; message: string }>(`${this.apiUrl}/profile`, req);
  }
}
