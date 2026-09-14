import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import { ContentCard, DiscoveryResponse, MovieDetails, ShowDetails } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/content`;

  getTrending(): Observable<DiscoveryResponse> {
    return this.http.get<ApiResponse<DiscoveryResponse>>(`${this.baseUrl}/discovery/trending`).pipe(
      map(res => res.data)
    );
  }

  getShows(page = 1, pageSize = 12, genre?: string): Observable<PagedResult<ContentCard>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (genre && genre !== 'All Genres') {
      params = params.set('genre', genre);
    }
    return this.http.get<ApiResponse<PagedResult<ContentCard>>>(`${this.baseUrl}/shows`, { params }).pipe(
      map(res => res.data)
    );
  }

  getMovies(page = 1, pageSize = 12, genre?: string): Observable<PagedResult<ContentCard>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (genre && genre !== 'All Genres') {
      params = params.set('genre', genre);
    }
    return this.http.get<ApiResponse<PagedResult<ContentCard>>>(`${this.baseUrl}/movies`, { params }).pipe(
      map(res => res.data)
    );
  }

  getShowBySlug(slug: string): Observable<ShowDetails> {
    return this.http.get<ApiResponse<ShowDetails>>(`${this.baseUrl}/shows/${slug}`).pipe(
      map(res => res.data)
    );
  }

  getMovieBySlug(slug: string): Observable<MovieDetails> {
    return this.http.get<ApiResponse<MovieDetails>>(`${this.baseUrl}/movies/${slug}`).pipe(
      map(res => res.data)
    );
  }

  search(query: string): Observable<ContentCard[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<ContentCard[]>>(`${this.baseUrl}/search`, { params }).pipe(
      map(res => res.data)
    );
  }

  seedInitialCatalog(): Observable<number> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/seed`, {}).pipe(
      map(res => res.data)
    );
  }
}
