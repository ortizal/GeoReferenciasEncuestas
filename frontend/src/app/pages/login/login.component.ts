import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Left: Form -->
      <div class="login-form-side">
        <div class="login-card">
          <div class="login-brand">
            <div class="brand-mark">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#34d399"/>
                <path d="M2 17L12 22L22 17" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h1 class="brand-title">ALANTEK</h1>
              <p class="brand-subtitle">GeoReferencias Encuestas</p>
            </div>
          </div>

          <div class="login-welcome">
            <h2>Bienvenido</h2>
            <p>Ingrese sus credenciales para acceder al sistema</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="login-form" autocomplete="off">
            <div class="form-field">
              <label for="username">Usuario</label>
              <div class="field-input" [class.error]="errors().username">
                <i class="bi bi-person"></i>
                <input type="text" id="username" [(ngModel)]="username" name="username"
                  placeholder="Ingrese su usuario" autocomplete="off">
              </div>
              <span class="field-error" *ngIf="errors().username">{{ errors().username }}</span>
            </div>

            <div class="form-field">
              <label for="password">Contraseña</label>
              <div class="field-input" [class.error]="errors().password">
                <i class="bi bi-lock"></i>
                <input [type]="showPassword() ? 'text' : 'password'" id="password"
                  [(ngModel)]="password" name="password" placeholder="Ingrese su contraseña" autocomplete="new-password">
                <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())">
                  <i class="bi" [ngClass]="showPassword() ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <span class="field-error" *ngIf="errors().password">{{ errors().password }}</span>
            </div>

            <div class="form-options">
              <label class="remember">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                <span>Recordarme</span>
              </label>
              <a href="#" class="forgot">¿Olvidó su contraseña?</a>
            </div>

            <button type="submit" class="login-btn" [disabled]="isLoading()">
              <span *ngIf="!isLoading()">Ingresar</span>
              <span *ngIf="isLoading()" class="loading-state">
                <span class="spinner"></span>
                Ingresando...
              </span>
            </button>

            <div class="error-alert" *ngIf="errorMessage()">
              <i class="bi bi-exclamation-circle"></i>
              {{ errorMessage() }}
            </div>
          </form>
        </div>
      </div>

      <!-- Right: Visual -->
      <div class="login-visual-side">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <div class="visual-icon">
            <i class="bi bi-geo-alt"></i>
          </div>
          <h2>Sistema GIS Catastral</h2>
          <p>Administración inteligente de manzanas, predios y visitas de campo con tecnología geoespacial de última generación.</p>
          <div class="visual-features">
            <div class="feature-item">
              <i class="bi bi-check-circle"></i>
              <span>Mapa interactivo con OpenStreetMap</span>
            </div>
            <div class="feature-item">
              <i class="bi bi-check-circle"></i>
              <span>Gestión de polígonos y marcadores</span>
            </div>
            <div class="feature-item">
              <i class="bi bi-check-circle"></i>
              <span>Reportes y estadísticas en tiempo real</span>
            </div>
          </div>
        </div>
        <div class="visual-footer">
          <span>&copy; 2026 ALANTEK. Plataforma GIS Profesional.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; min-height: 100vh; }

    .login-form-side {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: var(--space-8); background: var(--bg-app);
    }

    .login-card { width: 100%; max-width: 400px; }

    .login-brand {
      display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-8);
    }
    .brand-mark {
      width: 48px; height: 48px; border-radius: var(--radius-xl);
      background: var(--primary-800); display: flex; align-items: center; justify-content: center;
    }
    .brand-title { font-size: var(--text-xl); font-weight: 700; color: var(--text-primary); letter-spacing: 0.5px; margin: 0; }
    .brand-subtitle { font-size: var(--text-xs); color: var(--text-secondary); margin: 0; }

    .login-welcome { margin-bottom: var(--space-6); }
    .login-welcome h2 { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .login-welcome p { font-size: var(--text-sm); color: var(--text-secondary); margin: 0; }

    .login-form { display: flex; flex-direction: column; gap: var(--space-4); }

    .form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-field label { font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); }

    .field-input {
      display: flex; align-items: center; gap: var(--space-2);
      background: var(--bg-surface); border: 1px solid var(--border-default);
      border-radius: var(--radius-md); padding: 0 var(--space-3); height: 44px;
      transition: all var(--transition-fast);
      &:focus-within { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); }
      &.error { border-color: var(--danger-500); }
      i { color: var(--text-tertiary); font-size: 1rem; }
      input {
        flex: 1; border: none; background: transparent; font-family: var(--font-sans);
        font-size: var(--text-sm); color: var(--text-primary); outline: none; height: 100%;
        &::placeholder { color: var(--text-tertiary); }
      }
    }
    .pw-toggle {
      background: none; border: none; color: var(--text-tertiary); cursor: pointer;
      padding: var(--space-1); border-radius: var(--radius-sm);
      &:hover { color: var(--text-secondary); }
    }
    .field-error { font-size: 0.75rem; color: var(--danger-600); }

    .form-options { display: flex; justify-content: space-between; align-items: center; }
    .remember { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--text-secondary); cursor: pointer; }
    .forgot { font-size: var(--text-sm); color: var(--primary-600); text-decoration: none; &:hover { text-decoration: underline; } }

    .login-btn {
      width: 100%; height: 44px; border: none; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #fff; font-family: var(--font-sans); font-size: var(--text-base); font-weight: 600;
      cursor: pointer; transition: all var(--transition-base);
      &:hover:not(:disabled) { box-shadow: 0 4px 15px rgba(45,77,45,0.3); transform: translateY(-1px); }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .loading-state { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-alert {
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3);
      background: var(--danger-50); border: 1px solid var(--danger-100);
      border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--danger-700);
    }

    .login-visual-side {
      flex: 1; position: relative; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 50%, #0f1a0f 100%);
      overflow: hidden;
    }
    .visual-overlay {
      position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2334d399' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .visual-content {
      position: relative; z-index: 1; text-align: center; padding: var(--space-8); max-width: 420px;
    }
    .visual-icon {
      width: 80px; height: 80px; border-radius: var(--radius-2xl);
      background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.2);
      display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-6);
      i { font-size: 2rem; color: var(--emerald-400); }
    }
    .visual-content h2 { font-size: var(--text-3xl); font-weight: 700; color: #fff; margin: 0 0 var(--space-3); }
    .visual-content p { font-size: var(--text-sm); color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 var(--space-6); }
    .visual-features { display: flex; flex-direction: column; gap: var(--space-3); }
    .feature-item {
      display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm);
      color: rgba(255,255,255,0.85); i { color: var(--emerald-400); font-size: 1rem; }
    }
    .visual-footer {
      position: absolute; bottom: var(--space-5); z-index: 1;
      font-size: var(--text-xs); color: rgba(255,255,255,0.3);
    }

    @media (max-width: 768px) {
      .login-visual-side { display: none; }
      .login-form-side { padding: var(--space-5); }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = signal(false);
  rememberMe = false;
  isLoading = signal(false);
  errorMessage = signal('');
  errors = signal<{username?: string; password?: string}>({});
  private returnUrl: string;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit() {
    this.errors.set({});
    this.errorMessage.set('');

    if (!this.username.trim()) {
      this.errors.update(e => ({...e, username: 'El usuario es obligatorio'}));
      return;
    }
    if (!this.password) {
      this.errors.update(e => ({...e, password: 'La contraseña es obligatoria'}));
      return;
    }

    this.isLoading.set(true);
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.exitoso) this.router.navigateByUrl(this.returnUrl);
        else this.errorMessage.set(response.mensaje || 'Error al iniciar sesión');
      },
      error: () => { this.isLoading.set(false); this.errorMessage.set('Credenciales incorrectas'); }
    });
  }
}
