import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { Dashboard } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div><h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen general del sistema de georreferenciación</p></div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" *ngFor="let kpi of kpis">
          <div class="kpi-icon" [style.background]="kpi.bg">
            <i class="bi" [ngClass]="kpi.icon"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpi.value() }}</span>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
          <div class="kpi-trend" *ngIf="kpi.trend">
            <i class="bi" [ngClass]="kpi.trend > 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'"></i>
            <span>{{ kpi.trend }}%</span>
          </div>
        </div>
      </div>

      <!-- Secondary KPIs -->
      <div class="secondary-grid">
        <div class="mini-kpi" *ngFor="let mkpi of secondaryKpis">
          <div class="mini-dot" [style.background]="mkpi.color"></div>
          <div class="mini-info">
            <span class="mini-value">{{ mkpi.value() }}</span>
            <span class="mini-label">{{ mkpi.label }}</span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Chart Area -->
        <div class="card-premium chart-card">
          <div class="card-premium-header">
            <span class="card-premium-title">Visitas por Mes</span>
            <div class="chart-period">
              <button class="period-btn active">6M</button>
              <button class="period-btn">1A</button>
            </div>
          </div>
          <div class="card-premium-body">
            <div class="chart-bars">
              <div class="bar-group" *ngFor="let item of dashboard()?.visitasPorMes || []">
                <div class="bar-wrapper">
                  <div class="bar" [style.height.%]="getBarHeight(item.total)">
                    <span class="bar-tooltip">{{ item.total }}</span>
                  </div>
                </div>
                <span class="bar-label">{{ item.mes | slice:0:3 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribution -->
        <div class="card-premium dist-card">
          <div class="card-premium-header">
            <span class="card-premium-title">Distribución</span>
          </div>
          <div class="card-premium-body">
            <div class="dist-list">
              <div class="dist-item" *ngFor="let d of distributions">
                <div class="dist-color" [style.background]="d.color"></div>
                <span class="dist-label">{{ d.label }}</span>
                <span class="dist-value">{{ d.value() }}</span>
                <div class="dist-bar">
                  <div class="dist-bar-fill" [style.width.%]="getDistPercent(d.value())" [style.background]="d.color"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card-premium activity-card">
          <div class="card-premium-header">
            <span class="card-premium-title">Actividad Reciente</span>
            <a class="view-all" routerLink="/visitas">Ver todo</a>
          </div>
          <div class="card-premium-body no-padding">
            <div class="activity-list">
              <div class="activity-item" *ngFor="let act of dashboard()?.visitasRecientes || []">
                <div class="activity-dot" [ngClass]="'dot-' + act.estado?.toLowerCase()"></div>
                <div class="activity-info">
                  <span class="activity-text">{{ act.predio }} — {{ act.propietario }}</span>
                  <span class="activity-meta">{{ act.visitador }} · {{ act.fecha | date:'dd/MM HH:mm' }}</span>
                </div>
                <span class="badge-premium" [ngClass]="getEstadoBadge(act.estado)">{{ act.estado }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Map Preview -->
        <div class="card-premium map-preview-card">
          <div class="card-premium-header">
            <span class="card-premium-title">Vista del Mapa</span>
            <a class="view-all" routerLink="/mapa">Abrir mapa</a>
          </div>
          <div class="card-premium-body no-padding">
            <div class="map-placeholder">
              <div class="map-grid">
                <div class="grid-line" *ngFor="let i of [1,2,3,4,5]"></div>
              </div>
              <div class="map-dots">
                <div class="map-dot dot-green" style="top:30%;left:40%"></div>
                <div class="map-dot dot-blue" style="top:50%;left:60%"></div>
                <div class="map-dot dot-yellow" style="top:70%;left:35%"></div>
                <div class="map-dot dot-red" style="top:45%;left:75%"></div>
                <div class="map-dot dot-gray" style="top:25%;left:55%"></div>
              </div>
              <div class="map-center-label">
                <i class="bi bi-map"></i>
                <span>Mapa GIS Interactivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeIn 0.3s ease-out; }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    .kpi-card {
      display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5);
      background: var(--bg-surface); border: 1px solid var(--border-default);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-xs);
      transition: all var(--transition-base);
      &:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { font-size: 1.25rem; color: #fff; }
    }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-value { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .kpi-label { font-size: var(--text-xs); color: var(--text-secondary); margin-top: 2px; }
    .kpi-trend { margin-left: auto; display: flex; align-items: center; gap: 2px; font-size: var(--text-xs); font-weight: 600;
      & i.bi-arrow-up-short { color: var(--success-600); }
      & i.bi-arrow-down-short { color: var(--danger-600); }
    }

    .secondary-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);
      margin-bottom: var(--space-6);
    }
    .mini-kpi {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      background: var(--bg-surface); border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
    }
    .mini-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .mini-info { display: flex; flex-direction: column; }
    .mini-value { font-size: var(--text-base); font-weight: 600; color: var(--text-primary); }
    .mini-label { font-size: var(--text-xs); color: var(--text-secondary); }

    .content-grid {
      display: grid; grid-template-columns: 1fr 320px; grid-template-rows: auto auto;
      gap: var(--space-4);
    }
    .chart-card { grid-column: 1; grid-row: 1; }
    .dist-card { grid-column: 2; grid-row: 1; }
    .activity-card { grid-column: 1; grid-row: 2; }
    .map-preview-card { grid-column: 2; grid-row: 2; }

    .chart-period { display: flex; gap: var(--space-1); }
    .period-btn {
      padding: 0.25em 0.75em; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      background: transparent; font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary);
      cursor: pointer; transition: all var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      &.active { background: var(--primary-600); color: #fff; border-color: var(--primary-600); }
    }

    .chart-bars {
      display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding-top: var(--space-4);
    }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
    .bar-wrapper { height: 160px; display: flex; align-items: flex-end; }
    .bar {
      width: 36px; background: linear-gradient(180deg, var(--primary-400), var(--primary-600));
      border-radius: var(--radius-sm) var(--radius-sm) 0 0; transition: height 0.5s ease; position: relative;
      min-height: 4px;
      &:hover { filter: brightness(1.1); }
      &:hover .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(-4px); }
    }
    .bar-tooltip {
      position: absolute; top: -28px; left: 50%; transform: translateX(-50%);
      background: var(--neutral-900); color: #fff; padding: 2px 8px; border-radius: 4px;
      font-size: 0.6875rem; font-weight: 600; white-space: nowrap; opacity: 0; transition: all var(--transition-fast);
    }
    .bar-label { font-size: 0.6875rem; color: var(--text-tertiary); text-transform: uppercase; }

    .view-all {
      font-size: var(--text-xs); color: var(--primary-600); text-decoration: none; font-weight: 500;
      &:hover { text-decoration: underline; }
    }

    .dist-list { display: flex; flex-direction: column; gap: var(--space-4); }
    .dist-item { display: flex; align-items: center; gap: var(--space-3); }
    .dist-color { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .dist-label { font-size: var(--text-sm); color: var(--text-secondary); flex: 1; }
    .dist-value { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); min-width: 30px; text-align: right; }
    .dist-bar { width: 60px; height: 4px; background: var(--neutral-100); border-radius: 2px; overflow: hidden; }
    .dist-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

    .no-padding { padding: 0 !important; }
    .activity-list { display: flex; flex-direction: column; }
    .activity-item {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-5);
      border-bottom: 1px solid var(--border-light); transition: background var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      &:last-child { border-bottom: none; }
    }
    .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-positivo { background: var(--success-500); }
    .dot-negativo { background: var(--danger-500); }
    .dot-indeciso { background: var(--warning-500); }
    .dot-sin_visitar, .dot-pendiente { background: var(--neutral-400); }
    .activity-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .activity-text { font-size: var(--text-sm); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .activity-meta { font-size: var(--text-xs); color: var(--text-tertiary); }

    .map-placeholder {
      height: 220px; background: linear-gradient(135deg, var(--bg-surface), var(--bg-hover));
      position: relative; overflow: hidden;
    }
    .map-grid { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-evenly; opacity: 0.3; }
    .grid-line { height: 1px; background: var(--border-default); }
    .map-dots { position: absolute; inset: 0; }
    .map-dot {
      position: absolute; width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid var(--bg-surface); box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      animation: pulse 2s infinite;
    }
    .dot-green { background: var(--success-500); }
    .dot-blue { background: var(--info-500); }
    .dot-yellow { background: var(--warning-500); }
    .dot-red { background: var(--danger-500); }
    .dot-gray { background: var(--neutral-400); }
    .map-center-label {
      position: absolute; bottom: var(--space-4); left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4);
      background: var(--bg-surface-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
      i { color: var(--primary-600); }
      span { font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); }
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    @media (max-width: 1200px) { .kpi-grid, .secondary-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } .dist-card, .map-preview-card { grid-column: 1; } }
    @media (max-width: 768px) { .kpi-grid, .secondary-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  dashboard = signal<Dashboard | null>(null);

  kpis: any[] = [];
  secondaryKpis: any[] = [];
  distributions: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.obtenerDashboard().subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.dashboard.set(response.datos);
          this.buildKPIs();
        }
      }
    });
  }

  buildKPIs() {
    const d = this.dashboard()!;
    this.kpis = [
      { label: 'Manzanas', value: () => d.totalManzanas || 0, icon: 'bi-grid-3x3', bg: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', trend: 12 },
      { label: 'Predios', value: () => d.totalPredios || 0, icon: 'bi-house-door', bg: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))', trend: 8 },
      { label: 'Visitas', value: () => d.totalVisitas || 0, icon: 'bi-clipboard-check', bg: 'linear-gradient(135deg, var(--info-500), var(--info-600))', trend: 15 },
      { label: 'Cobertura', value: () => (d.porcentajeCobertura || 0).toFixed(1) + '%', icon: 'bi-percent', bg: 'linear-gradient(135deg, var(--warning-500), var(--warning-600))', trend: null },
    ];

    this.secondaryKpis = [
      { label: 'Positivos', value: () => d.positivos || 0, color: 'var(--success-500)' },
      { label: 'Negativos', value: () => d.negativos || 0, color: 'var(--danger-500)' },
      { label: 'Indecisos', value: () => d.indecisos || 0, color: 'var(--warning-500)' },
      { label: 'Sin Visitar', value: () => d.sinVisitar || 0, color: 'var(--neutral-400)' },
    ];

    this.distributions = [
      { label: 'Positivos', value: () => d.positivos || 0, color: 'var(--success-500)' },
      { label: 'Negativos', value: () => d.negativos || 0, color: 'var(--danger-500)' },
      { label: 'Indecisos', value: () => d.indecisos || 0, color: 'var(--warning-500)' },
      { label: 'Sin Visitar', value: () => d.sinVisitar || 0, color: 'var(--neutral-400)' },
    ];
  }

  getBarHeight(total: number): number {
    const max = Math.max(...(this.dashboard()?.visitasPorMes?.map(v => v.total) || [1]));
    return max > 0 ? Math.max((total / max) * 100, 3) : 3;
  }

  getDistPercent(value: number): number {
    const total = (this.dashboard()?.totalPredios || 1);
    return Math.min((value / total) * 100, 100);
  }

  getEstadoBadge(estado: string): string {
    switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; default: return 'badge-neutral'; }
  }
}
