import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <i class="bi bi-globe2"></i>
        </div>
        <div class="brand-text" *ngIf="!isCollapsed()">
          <span class="brand-name">ALANTEK</span>
          <span class="brand-sub">GeoRef</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section" *ngIf="!isCollapsed()">
          <span class="nav-section-title">Principal</span>
        </div>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" [title]="isCollapsed() ? 'Dashboard' : ''">
          <i class="bi bi-grid-1x2 nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Dashboard</span>
        </a>

        <div class="nav-section" *ngIf="!isCollapsed()">
          <span class="nav-section-title">Gestión Catastral</span>
        </div>
        <a class="nav-item" routerLink="/manzanas" routerLinkActive="active" [title]="isCollapsed() ? 'Manzanas' : ''">
          <i class="bi bi-grid-3x3 nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Manzanas</span>
        </a>
        <a class="nav-item" routerLink="/predios" routerLinkActive="active" [title]="isCollapsed() ? 'Predios' : ''">
          <i class="bi bi-house-door nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Predios</span>
        </a>
        <a class="nav-item" routerLink="/visitas" routerLinkActive="active" [title]="isCollapsed() ? 'Visitas' : ''">
          <i class="bi bi-clipboard-check nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Visitas</span>
        </a>

        <div class="nav-divider"></div>

        <div class="nav-section" *ngIf="!isCollapsed()">
          <span class="nav-section-title">Herramientas</span>
        </div>
        <a class="nav-item" routerLink="/mapa" routerLinkActive="active" [title]="isCollapsed() ? 'Mapa GIS' : ''">
          <i class="bi bi-map nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Mapa GIS</span>
          <span class="nav-badge" *ngIf="!isCollapsed()">GIS</span>
        </a>
        <a class="nav-item" routerLink="/reportes" routerLinkActive="active" [title]="isCollapsed() ? 'Reportes' : ''">
          <i class="bi bi-file-earmark-bar-graph nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Reportes</span>
        </a>

        <div class="nav-divider"></div>

        <div class="nav-section" *ngIf="!isCollapsed() && isAdmin()">
          <span class="nav-section-title">Sistema</span>
        </div>
        <a class="nav-item" routerLink="/usuarios" routerLinkActive="active" *ngIf="isAdmin()" [title]="isCollapsed() ? 'Usuarios' : ''">
          <i class="bi bi-people nav-icon"></i>
          <span class="nav-label" *ngIf="!isCollapsed()">Usuarios</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" *ngIf="!isCollapsed()">
          <div class="sidebar-user-avatar"><span>{{ getInitials() }}</span></div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ auth.currentUser()?.nombre }}</span>
            <span class="sidebar-user-role">{{ getRol() }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width); height: 100vh; background: var(--bg-sidebar);
      position: fixed; left: 0; top: 0; z-index: 1001;
      display: flex; flex-direction: column;
      transition: width var(--transition-slow);
      border-right: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

    .sidebar-brand {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); height: var(--header-height);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-logo {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--emerald-500), var(--emerald-700));
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { color: #fff; font-size: 1rem; }
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-name { color: #fff; font-size: 0.875rem; font-weight: 700; letter-spacing: 0.5px; }
    .brand-sub { color: rgba(255,255,255,0.5); font-size: 0.6875rem; font-weight: 500; }

    .sidebar-nav { flex: 1; padding: var(--space-3) var(--space-3); overflow-y: auto; }
    .nav-section { padding: var(--space-3) var(--space-3) var(--space-1); }
    .nav-section-title {
      font-size: 0.6875rem; font-weight: 600; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .nav-divider { height: 1px; background: rgba(255,255,255,0.06); margin: var(--space-2) var(--space-3); }

    .nav-item {
      display: flex; align-items: center; gap: var(--space-3); padding: 0.5rem var(--space-3);
      border-radius: var(--radius-md); color: rgba(255,255,255,0.65);
      text-decoration: none; transition: all var(--transition-fast); cursor: pointer;
      margin-bottom: 2px; position: relative;
      &:hover { background: rgba(255,255,255,0.08); color: #fff; }
      &.active {
        background: rgba(255,255,255,0.1); color: #fff;
        &::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 20px; background: var(--emerald-400); border-radius: 0 3px 3px 0;
        }
      }
    }
    .nav-icon { font-size: 1.1rem; width: 22px; text-align: center; flex-shrink: 0; }
    .nav-label { font-size: 0.875rem; font-weight: 500; white-space: nowrap; }
    .nav-badge {
      margin-left: auto; padding: 0.15em 0.5em; font-size: 0.625rem; font-weight: 700;
      background: linear-gradient(135deg, var(--emerald-500), var(--emerald-600));
      color: #fff; border-radius: var(--radius-full); letter-spacing: 0.05em;
    }

    .sidebar-footer { padding: var(--space-3) var(--space-4); border-top: 1px solid rgba(255,255,255,0.06); }
    .sidebar-user { display: flex; align-items: center; gap: var(--space-3); }
    .sidebar-user-avatar {
      width: 32px; height: 32px; border-radius: var(--radius-full);
      background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      span { color: #fff; font-size: 0.75rem; font-weight: 600; }
    }
    .sidebar-user-info { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
    .sidebar-user-name { font-size: var(--text-sm); font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sidebar-user-role { font-size: var(--text-xs); color: rgba(255,255,255,0.45); }
  `]
})
export class SidebarComponent {
  isCollapsed = input<boolean>(false);

  constructor(public auth: AuthService) {}

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
}
