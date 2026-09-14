import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-panel">
        <div class="auth-header">
          <div class="brand-badge">JOIN THE COMMUNITY</div>
          <h2>Create Account</h2>
          <p class="subtitle">Join over 1M+ movie and TV lovers on OTT PRO.</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              class="form-control"
              formControlName="fullName"
              placeholder="e.g. Alex Mercer"
            />
            <span *ngIf="registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid" class="form-error">
              Full name is required.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input
              id="username"
              type="text"
              class="form-control"
              formControlName="username"
              placeholder="e.g. cinephile_alex"
            />
            <span *ngIf="registerForm.get('username')?.touched && registerForm.get('username')?.invalid" class="form-error">
              Username must be 3-30 characters (letters, numbers, underscore).
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="e.g. alex@example.com"
            />
            <span *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid" class="form-error">
              Valid email is required.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="At least 8 characters with number & symbol"
            />
            <span *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid" class="form-error">
              Password must be at least 8 characters.
            </span>
          </div>

          <button type="submit" [disabled]="registerForm.invalid || isLoading" class="btn btn-primary btn-block">
            <span *ngIf="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Creating Account...' : 'Get Started' }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login" class="auth-link">Sign In</a></p>
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
      max-width: 460px;
      padding: 36px 32px;
      border: 1px solid var(--border-subtle);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern('^[a-zA-Z0-9_]+$')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.authService.register({
      fullName: this.registerForm.value.fullName!,
      username: this.registerForm.value.username!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!
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
