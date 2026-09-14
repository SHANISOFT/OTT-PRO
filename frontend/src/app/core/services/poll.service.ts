import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PollOptionDto {
  id: string;
  optionText: string;
  votesCount: number;
  percentage: number;
}

export interface PollDto {
  id: string;
  title: string;
  description?: string;
  totalVotes: number;
  startsAt: string;
  endsAt: string;
  status: string;
  hasVoted: boolean;
  options: PollOptionDto[];
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  category?: string;
  options: string[];
  durationDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/polls`;

  getPolls(): Observable<{ data: PollDto[]; success: boolean; message: string }> {
    return this.http.get<{ data: PollDto[]; success: boolean; message: string }>(this.apiUrl);
  }

  createPoll(req: CreatePollRequest): Observable<{ data: any; success: boolean; message: string }> {
    return this.http.post<{ data: any; success: boolean; message: string }>(this.apiUrl, req);
  }

  vote(pollId: string, optionId: string): Observable<{ data: boolean; success: boolean; message: string }> {
    return this.http.post<{ data: boolean; success: boolean; message: string }>(`${this.apiUrl}/${pollId}/vote`, { optionId });
  }

  deletePoll(pollId: string): Observable<{ data: boolean; success: boolean; message: string }> {
    return this.http.delete<{ data: boolean; success: boolean; message: string }>(`${this.apiUrl}/${pollId}`);
  }
}
