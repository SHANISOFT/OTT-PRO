import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(this.tokenStorage.getUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.tokenStorage.getAccessToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'superadmin');
  }

  isAdmin$ = this.currentUser$.pipe(
    map(u => !!u?.roles?.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'superadmin'))
  );

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
          this.toast.success(`Welcome to OTT PRO, ${res.data.user.username}!`);
        }
      })
    );
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
          this.toast.success(`Welcome back, ${res.data.user.username}!`);
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const currentRefreshToken = this.tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/refresh-token`, { refreshToken: currentRefreshToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken }).subscribe({
        error: () => { /* ignore */ }
      });
    }

    this.tokenStorage.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
    this.toast.info('Logged out of session.');
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    this.tokenStorage.setAccessToken(auth.accessToken);
    this.tokenStorage.setRefreshToken(auth.refreshToken);
    this.tokenStorage.setUser(auth.user);
    this.currentUserSubject.next(auth.user);
    this.isAuthenticatedSubject.next(true);
  }
}
