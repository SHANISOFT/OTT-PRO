import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-panel">
        <div class="auth-header">
          <div class="brand-badge">OTT PRO</div>
          <h2>Welcome Back</h2>
          <p class="subtitle">Sign in to track your shows, join watch parties, and explore recommendations.</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="emailOrUsername">Email or Username</label>
            <input
              id="emailOrUsername"
              type="text"
              class="form-control"
              formControlName="emailOrUsername"
              placeholder="e.g. cinephile_alex or alex@example.com"
            />
            <span *ngIf="loginForm.get('emailOrUsername')?.touched && loginForm.get('emailOrUsername')?.invalid" class="form-error">
              Please enter your username or email address.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="Enter your password"
            />
            <span *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="form-error">
              Password is required.
            </span>
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading" class="btn btn-primary btn-block">
            <span *ngIf="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/auth/register" class="auth-link">Join OTT PRO</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      border: 1px solid var(--border-subtle);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-badge {
      display: inline-block;
      font-family: var(--font-display);
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--primary);
      background: rgba(229, 9, 20, 0.15);
      border: 1px solid rgba(229, 9, 20, 0.3);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      margin-bottom: 12px;
      letter-spacing: 0.06em;
    }
    h2 {
      font-size: 1.8rem;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .form-error {
      color: var(--accent-rose);
      font-size: 0.8rem;
      margin-top: 4px;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
      padding: 13px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .auth-link {
      color: var(--primary);
      font-weight: 600;
    }
    .auth-link:hover {
      text-decoration: underline;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;

  loginForm = this.fb.group({
    emailOrUsername: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authService.login({
      emailOrUsername: this.loginForm.value.emailOrUsername!,
      password: this.loginForm.value.password!
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/discovery']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
