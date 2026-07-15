import { Component, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService, NotificacionVisita } from '../../core/services/websocket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button class="icon-btn sidebar-toggle" (click)="toggleSidebar.emit()">
          <i class="bi bi-list"></i>
        </button>
        <div class="search-global">
          <i class="bi bi-search search-icon"></i>
          <input type="text" placeholder="Buscar módulos, módulos..." class="search-input">
          <kbd class="search-shortcut">Ctrl+K</kbd>
        </div>
      </div>

      <div class="header-right">
        <button class="icon-btn" title="Notificaciones" (click)="toggleNotificaciones()">
          <i class="bi bi-bell"></i>
          <span class="notification-dot" *ngIf="wsService.notificaciones().length > 0"></span>
          <span class="notification-count" *ngIf="wsService.notificaciones().length > 0">{{ wsService.notificaciones().length }}</span>
        </button>

        <button class="icon-btn" (click)="toggleTheme()" [title]="isDark() ? 'Modo claro' : 'Modo oscuro'">
          <i class="bi" [ngClass]="isDark() ? 'bi-sun' : 'bi-moon'"></i>
        </button>

        <div class="header-divider"></div>

        <div class="user-menu" (click)="showUserMenu.set(!showUserMenu())">
          <div class="user-avatar">
            <span>{{ getInitials() }}</span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser()?.nombre }}</span>
            <span class="user-role">{{ getRol() }}</span>
          </div>
          <i class="bi bi-chevron-down"></i>
        </div>

        <div class="user-dropdown" *ngIf="showUserMenu()">
          <div class="dropdown-header">
            <div class="dropdown-avatar"><span>{{ getInitials() }}</span></div>
            <div><div class="dropdown-name">{{ auth.currentUser()?.nombre }} {{ auth.currentUser()?.apellido }}</div>
            <div class="dropdown-email">{{ auth.currentUser()?.email }}</div></div>
          </div>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" (click)="showUserMenu.set(false)"><i class="bi bi-person"></i>Mi perfil</a>
          <a class="dropdown-item" (click)="abrirCambioContrasena()"><i class="bi bi-key"></i>Cambiar contraseña</a>
          <a class="dropdown-item" (click)="irAConfiguracion()" *ngIf="isAdmin()"><i class="bi bi-gear"></i>Configuración</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item danger" (click)="cerrarSesion()"><i class="bi bi-box-arrow-right"></i>Cerrar sesión</a>
        </div>

        <div class="notif-dropdown" *ngIf="showNotificaciones()">
          <div class="notif-header">
            <h4>Notificaciones</h4>
            <button class="notif-clear" *ngIf="wsService.notificaciones().length > 0" (click)="wsService.clearNotificaciones()">Limpiar</button>
          </div>
          <div class="notif-list">
            <div class="notif-empty" *ngIf="wsService.notificaciones().length === 0">
              <i class="bi bi-bell-slash"></i>
              <span>Sin notificaciones</span>
            </div>
            <div class="notif-item" *ngFor="let n of wsService.notificaciones()">
              <div class="notif-icon" [ngClass]="getNotifIconClass(n.estadoVisita)">
                <i class="bi bi-clipboard-check"></i>
              </div>
              <div class="notif-content">
                <span class="notif-mensaje">{{ n.mensaje }}</span>
                <span class="notif-meta">{{ n.nombreVisitador }} · {{ n.fechaVisita | date:'HH:mm' }}</span>
              </div>
              <span class="notif-badge" [ngClass]="getEstadoBadgeClass(n.estadoVisita)">{{ n.estadoVisita }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="modal-overlay" *ngIf="showCambioContrasena()" (click)="cerrarCambioContrasena()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4>Cambiar Contraseña</h4>
          <button class="modal-close" (click)="cerrarCambioContrasena()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>Contraseña Actual *</label>
            <input class="form-input" type="password" [(ngModel)]="cambioPass.actual" placeholder="Ingrese contraseña actual">
          </div>
          <div class="form-field">
            <label>Nueva Contraseña *</label>
            <input class="form-input" type="password" [(ngModel)]="cambioPass.nueva" placeholder="Mínimo 8 caracteres">
          </div>
          <div class="form-field">
            <label>Confirmar Contraseña *</label>
            <input class="form-input" type="password" [(ngModel)]="cambioPass.confirmar" placeholder="Repita la nueva contraseña">
          </div>
          <div class="mensaje error" *ngIf="cambioPassMensaje() && !cambioPassMensaje().includes('exitosamente')">
            <i class="bi bi-exclamation-circle-fill"></i> {{ cambioPassMensaje() }}
          </div>
          <div class="mensaje success" *ngIf="cambioPassMensaje() && cambioPassMensaje().includes('exitosamente')">
            <i class="bi bi-check-circle-fill"></i> {{ cambioPassMensaje() }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="cerrarCambioContrasena()">Cancelar</button>
          <button class="btn-save" (click)="cambiarContrasena()" [disabled]="cambioPassSaving()">{{ cambioPassSaving() ? 'Guardando...' : 'Cambiar Contraseña' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 var(--space-5); height: var(--header-height);
      background: var(--bg-header); border-bottom: 1px solid var(--border-default);
      position: sticky; top: 0; z-index: 1000;
    }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--space-3); }
    .icon-btn {
      display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
      background: transparent; border: none; border-radius: var(--radius-md); color: var(--text-secondary);
      cursor: pointer; transition: all var(--transition-fast); position: relative;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }
    .notification-dot {
      position: absolute; top: 4px; right: 4px; width: 8px; height: 8px;
      background: var(--danger-500); border-radius: 50%; border: 2px solid var(--bg-header);
    }
    .notification-count {
      position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px;
      background: var(--danger-500); color: #fff; font-size: 9px; font-weight: 700;
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      padding: 0 4px; border: 2px solid var(--bg-header);
    }
    .search-global {
      display: flex; align-items: center; gap: var(--space-2);
      background: var(--neutral-50); border: 1px solid var(--border-light);
      border-radius: var(--radius-lg); padding: 0 var(--space-3); height: 36px; min-width: 280px;
      transition: all var(--transition-fast);
      &:focus-within { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.08); background: var(--bg-surface); }
    }
    .search-icon { color: var(--text-tertiary); font-size: 0.875rem; }
    .search-input {
      flex: 1; border: none; background: transparent; font-family: var(--font-sans);
      font-size: var(--text-sm); color: var(--text-primary); outline: none;
      &::placeholder { color: var(--text-tertiary); }
    }
    .search-shortcut {
      font-size: 0.6875rem; color: var(--text-tertiary); background: var(--bg-surface);
      border: 1px solid var(--border-default); border-radius: 4px; padding: 0.1em 0.4em;
      font-family: var(--font-sans);
    }
    .header-divider { width: 1px; height: 24px; background: var(--border-default); }
    .user-menu {
      display: flex; align-items: center; gap: var(--space-2); cursor: pointer;
      padding: var(--space-1) var(--space-2); border-radius: var(--radius-md);
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      i { font-size: 0.75rem; color: var(--text-tertiary); }
    }
    .user-avatar {
      width: 32px; height: 32px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      display: flex; align-items: center; justify-content: center;
      span { color: #fff; font-size: 0.75rem; font-weight: 600; }
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    .user-name { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
    .user-role { font-size: var(--text-xs); color: var(--text-tertiary); }
    .user-dropdown {
      position: absolute; top: calc(var(--header-height) - 4px); right: var(--space-5);
      width: 260px; background: var(--bg-surface); border: 1px solid var(--border-default);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); z-index: 1001;
      animation: fadeIn 0.15s ease-out; overflow: hidden;
    }
    .dropdown-header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); }
    .dropdown-avatar {
      width: 40px; height: 40px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      span { color: #fff; font-size: 0.875rem; font-weight: 600; }
    }
    .dropdown-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); }
    .dropdown-email { font-size: var(--text-xs); color: var(--text-secondary); }
    .dropdown-divider { height: 1px; background: var(--border-light); margin: 0; }
    .dropdown-item {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      font-size: var(--text-sm); color: var(--text-primary); cursor: pointer; text-decoration: none;
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      &.danger { color: var(--danger-600); &:hover { background: var(--danger-50); } }
      i { font-size: 0.9375rem; color: var(--text-tertiary); width: 20px; text-align: center; }
    }

    .notif-dropdown {
      position: absolute; top: calc(var(--header-height) - 4px); right: 80px;
      width: 360px; max-height: 400px; background: var(--bg-surface); border: 1px solid var(--border-default);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); z-index: 1001;
      animation: fadeIn 0.15s ease-out; overflow: hidden; display: flex; flex-direction: column;
    }
    .notif-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-light); }
    .notif-header h4 { margin: 0; font-size: var(--text-sm); font-weight: 600; }
    .notif-clear { background: none; border: none; color: var(--primary-600); font-size: var(--text-xs); cursor: pointer; }
    .notif-list { overflow-y: auto; flex: 1; }
    .notif-empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm); }
    .notif-empty i { font-size: 1.5rem; }
    .notif-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-light); transition: background var(--transition-fast); }
    .notif-item:hover { background: var(--bg-hover); }
    .notif-icon { width: 32px; height: 32px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #fff; flex-shrink: 0; }
    .notif-icon.notif-positivo { background: #22c55e; }
    .notif-icon.notif-negativo { background: #ef4444; }
    .notif-icon.notif-indeciso { background: #f59e0b; }
    .notif-icon.notif-default { background: #6b7280; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-mensaje { display: block; font-size: var(--text-xs); font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-meta { display: block; font-size: 10px; color: var(--text-tertiary); margin-top: 1px; }
    .notif-badge { font-size: 9px; padding: 2px 6px; border-radius: var(--radius-full); font-weight: 600; white-space: nowrap; flex-shrink: 0; }
    .notif-badge.badge-positivo { background: rgba(34,197,94,0.15); color: #22c55e; }
    .notif-badge.badge-negativo { background: rgba(239,68,68,0.15); color: #ef4444; }
    .notif-badge.badge-indeciso { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .notif-badge.badge-default { background: var(--neutral-150); color: var(--text-secondary); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 4000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-xl); width: 90%; max-width: 420px; box-shadow: var(--shadow-lg); animation: fadeIn 0.15s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .modal-header h4 { margin: 0; font-size: var(--text-base); font-weight: 600; }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); }
    .modal-close:hover { background: var(--bg-hover); }
    .modal-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border-light); }
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); }
    .form-field label { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
    .form-input { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; }
    .form-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; }
    .btn-cancel:hover { background: var(--bg-hover); }
    .btn-save { padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
    .btn-save:hover:not(:disabled) { background: var(--primary-700); }
    .btn-save:disabled { opacity: 0.6; }
    .mensaje { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm); }
    .mensaje.success { background: rgba(34,197,94,0.1); color: #16a34a; }
    .mensaje.error { background: rgba(239,68,68,0.1); color: #dc2626; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) {
      .search-global { display: none; }
      .user-info { display: none; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  toggleSidebar = output<void>();
  showUserMenu = signal(false);
  showNotificaciones = signal(false);
  isDark = signal(false);
  showCambioContrasena = signal(false);
  cambioPass = { actual: '', nueva: '', confirmar: '' };
  cambioPassSaving = signal(false);
  cambioPassMensaje = signal('');

  constructor(
    public auth: AuthService,
    public wsService: WebSocketService,
    private router: Router
  ) {
    this.isDark.set(document.documentElement.getAttribute('data-theme') === 'dark');
  }

  ngOnInit() {
    this.wsService.connect();
  }

  toggleTheme() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  toggleNotificaciones() {
    this.showNotificaciones.set(!this.showNotificaciones());
    this.showUserMenu.set(false);
  }

  getInitials(): string {
    const u = this.auth.currentUser();
    return ((u?.nombre?.[0] || '') + (u?.apellido?.[0] || '')).toUpperCase();
  }

  getRol(): string {
    const r = this.auth.currentUser()?.roles;
    if (r?.includes('ADMINISTRADOR')) return 'Administrador';
    if (r?.includes('SUPERVISOR')) return 'Supervisor';
    return 'Visitador';
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.roles?.includes('ADMINISTRADOR') ?? false;
  }

  getNotifIconClass(estado: string): string {
    switch (estado) {
      case 'POSITIVO': return 'notif-positivo';
      case 'NEGATIVO': return 'notif-negativo';
      case 'INDECISO': return 'notif-indeciso';
      default: return 'notif-default';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'POSITIVO': return 'badge-positivo';
      case 'NEGATIVO': return 'badge-negativo';
      case 'INDECISO': return 'badge-indeciso';
      default: return 'badge-default';
    }
  }

  irAConfiguracion() {
    this.showUserMenu.set(false);
    this.router.navigate(['/configuracion']);
  }

  abrirCambioContrasena() {
    this.showUserMenu.set(false);
    this.cambioPass = { actual: '', nueva: '', confirmar: '' };
    this.cambioPassMensaje.set('');
    this.showCambioContrasena.set(true);
  }

  cerrarCambioContrasena() {
    this.showCambioContrasena.set(false);
    this.cambioPassMensaje.set('');
  }

  cambiarContrasena() {
    if (!this.cambioPass.actual || !this.cambioPass.nueva || !this.cambioPass.confirmar) {
      this.cambioPassMensaje.set('Todos los campos son obligatorios.');
      return;
    }
    if (this.cambioPass.nueva.length < 8) {
      this.cambioPassMensaje.set('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.cambioPass.nueva !== this.cambioPass.confirmar) {
      this.cambioPassMensaje.set('Las contraseñas no coinciden.');
      return;
    }

    this.cambioPassSaving.set(true);
    this.cambioPassMensaje.set('');

    this.auth.cambioContrasena(this.cambioPass.actual, this.cambioPass.nueva, this.cambioPass.confirmar).subscribe({
      next: (r) => {
        this.cambioPassSaving.set(false);
        if (r.exitoso) {
          this.cambioPassMensaje.set('Contraseña cambiada exitosamente');
          setTimeout(() => this.cerrarCambioContrasena(), 1500);
        } else {
          this.cambioPassMensaje.set(r.mensaje || 'Error al cambiar contraseña');
        }
      },
      error: (err) => {
        this.cambioPassSaving.set(false);
        this.cambioPassMensaje.set(err?.error?.mensaje || 'Error al conectar con el servidor');
      }
    });
  }

  cerrarSesion() { this.auth.logout(); }
}
