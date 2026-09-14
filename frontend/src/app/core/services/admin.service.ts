import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AdminStats {
  users: { total: number; active: number; banned: number };
  watchParties: { active: number; total: number };
  content: { totalShows: number; totalMovies: number; total: number };
  polls: { totalPolls: number; totalVotes: number };
  system: { status: string; environment: string; timestamp: string };
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  roles: string[];
  isAdmin: boolean;
  status: 'Active' | 'Suspended' | 'Banned';
  createdAt: string;
  watchTime: number;
}

export interface AdminParty {
  id: string;
  roomCode: string;
  title: string;
  isPrivate: boolean;
  status: string;
  createdAt: string;
  hostUserId: string;
  hostUsername: string;
  hostAvatarUrl?: string;
  memberCount: number;
  currentPlayback?: any;
}

export interface AdminContentItem {
  id: string;
  title: string;
  type: 'Movie' | 'Show';
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  genres: string[];
  releaseDate?: string;
  rating: number;
  runtimeMinutes?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  trailerUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.apiUrl}/stats`);
  }

  getUsers(page = 1, pageSize = 50, search = ''): Observable<ApiResponse<{ users: AdminUser[]; total: number; page: number; pageSize: number }>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<ApiResponse<{ users: AdminUser[]; total: number; page: number; pageSize: number }>>(`${this.apiUrl}/users`, { params });
  }

  updateUserRole(userId: string, role: 'Admin' | 'User'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  updateUserStatus(userId: string, status: 'Active' | 'Suspended' | 'Banned'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/users/${userId}/status`, { status });
  }

  getActiveParties(): Observable<ApiResponse<AdminParty[]>> {
    return this.http.get<ApiResponse<AdminParty[]>>(`${this.apiUrl}/parties`);
  }

  forceTerminateParty(roomCode: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/parties/${roomCode}`);
  }

  getAllContent(): Observable<ApiResponse<AdminContentItem[]>> {
    return this.http.get<ApiResponse<AdminContentItem[]>>(`${this.apiUrl}/content`);
  }

  createContent(item: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/content`, item);
  }

  deleteContent(type: 'Movie' | 'Show', id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/content/${type}/${id}`);
  }

  createOfficialPoll(poll: { title: string; description?: string; category: string; options: string[]; durationDays: number }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/polls`, poll);
  }

  deletePoll(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/polls/${id}`);
  }
}
