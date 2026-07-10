import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
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
        <button class="icon-btn" title="Notificaciones">
          <i class="bi bi-bell"></i>
          <span class="notification-dot"></span>
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
          <a class="dropdown-item"><i class="bi bi-person"></i>Mi perfil</a>
          <a class="dropdown-item"><i class="bi bi-key"></i>Cambiar contraseña</a>
          <a class="dropdown-item"><i class="bi bi-gear"></i>Configuración</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item danger" (click)="cerrarSesion()"><i class="bi bi-box-arrow-right"></i>Cerrar sesión</a>
        </div>
      </div>
    </header>
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
      position: absolute; top: 6px; right: 6px; width: 8px; height: 8px;
      background: var(--danger-500); border-radius: 50%; border: 2px solid var(--bg-header);
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
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) {
      .search-global { display: none; }
      .user-info { display: none; }
    }
  `]
})
export class HeaderComponent {
  toggleSidebar = output<void>();
  showUserMenu = signal(false);
  isDark = signal(false);

  constructor(public auth: AuthService) {
    this.isDark.set(document.documentElement.getAttribute('data-theme') === 'dark');
  }

  toggleTheme() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
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

  cerrarSesion() { this.auth.logout(); }
}
