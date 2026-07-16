import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { Dashboard } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
            <span class="card-premium-title">Visitas por Día</span>
            <div class="chart-controls">
              <div class="date-filters">
                <label>Desde: <input type="date" [ngModel]="fechaDesde()" (ngModelChange)="onFechaDesdeChange($event)"></label>
                <label>Hasta: <input type="date" [ngModel]="fechaHasta()" (ngModelChange)="onFechaHastaChange($event)"></label>
                <button class="filter-btn" (click)="aplicarFechas()">Aplicar</button>
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot" style="background:#2563EB"></span>Positivo</span>
                <span class="legend-item"><span class="legend-dot" style="background:#DC2626"></span>Negativo</span>
                <span class="legend-item"><span class="legend-dot" style="background:#F59E0B"></span>Indeciso</span>
                <span class="legend-item"><span class="legend-dot" style="background:#6B7280"></span>En Blanco</span>
                <span class="legend-item"><span class="legend-dot" style="background:#1C1C1C"></span>No Trabajable</span>
              </div>
            </div>
          </div>
          <div class="card-premium-body">
            <div class="line-chart" *ngIf="chartDays().length > 0">
              <div class="chart-y-axis">
                <span *ngFor="let v of yLabels()">{{ v }}</span>
              </div>
              <div class="chart-area">
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" preserveAspectRatio="none" class="chart-svg">
                  <line *ngFor="let y of yGridLines()" [attr.x1]="0" [attr.y1]="y" [attr.x2]="chartWidth" [attr.y2]="y" class="grid-line"/>
                  <polyline *ngFor="let line of chartLines()" [attr.points]="line.points" [attr.stroke]="line.color" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <g *ngFor="let line of chartLines()">
                    <circle *ngFor="let pt of line.dots" [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" [attr.fill]="line.color" class="chart-dot"/>
                  </g>
                </svg>
                <div class="chart-x-axis">
                  <span *ngFor="let d of chartDays(); let i = index" [class.visible]="i % xLabelStep() === 0">{{ d }}</span>
                </div>
              </div>
            </div>
            <div class="chart-empty" *ngIf="chartDays().length === 0">
              <i class="bi bi-bar-chart-line"></i>
              <span>No hay datos de visitas por día</span>
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
                <label class="dist-check">
                  <input type="checkbox" [checked]="isStatusVisible(d.key)" (change)="toggleStatusFilter(d.key)">
                  <span class="dist-color" [style.background]="d.color"></span>
                </label>
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
                <div class="activity-dot" [style.background]="getStatusColor(act.estado)"></div>
                <div class="activity-info">
                  <span class="activity-text">{{ act.predio }} — {{ act.propietario }}</span>
                  <span class="activity-meta">{{ act.visitador }} · {{ act.fecha | date:'dd/MM HH:mm' }}</span>
                </div>
                <span class="badge-premium" [style.background]="getStatusColor(act.estado)" style="color:#fff;padding:2px 8px;border-radius:12px;font-size:0.6875rem;font-weight:600">{{ act.estado }}</span>
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
                <div class="map-dot" style="top:30%;left:40%;background:#2563EB"></div>
                <div class="map-dot" style="top:50%;left:60%;background:#DC2626"></div>
                <div class="map-dot" style="top:70%;left:35%;background:#F59E0B"></div>
                <div class="map-dot" style="top:45%;left:75%;background:#6B7280"></div>
                <div class="map-dot" style="top:25%;left:55%;background:#1C1C1C"></div>
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
      display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3);
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

    .chart-controls { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-end; }
    .date-filters { display: flex; align-items: center; gap: var(--space-2); }
    .date-filters label { font-size: var(--text-xs); color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
    .date-filters input[type="date"] {
      padding: 2px 6px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      font-size: var(--text-xs); background: var(--bg-surface); color: var(--text-primary);
    }
    .filter-btn {
      padding: 2px 10px; background: var(--primary-600); color: #fff; border: none;
      border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 500; cursor: pointer;
      &:hover { background: var(--primary-700); }
    }

    .chart-legend { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: flex-end; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--text-secondary); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    .line-chart { display: flex; gap: var(--space-2); height: 220px; padding: var(--space-2) 0; }
    .chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; padding: 0 var(--space-1); min-width: 30px; text-align: right; }
    .chart-y-axis span { font-size: 0.625rem; color: var(--text-tertiary); line-height: 1; }
    .chart-area { flex: 1; display: flex; flex-direction: column; position: relative; }
    .chart-svg { width: 100%; flex: 1; }
    .grid-line { stroke: var(--border-light); stroke-width: 0.5; stroke-dasharray: 4,4; }
    .chart-dot { opacity: 0; transition: opacity 0.15s; }
    .chart-svg:hover .chart-dot { opacity: 1; }
    .chart-x-axis { display: flex; justify-content: space-between; padding-top: var(--space-1); }
    .chart-x-axis span { font-size: 0.625rem; color: var(--text-tertiary); visibility: hidden; }
    .chart-x-axis span.visible { visibility: visible; }
    .chart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-tertiary); gap: var(--space-2);
      i { font-size: 2rem; } span { font-size: var(--text-sm); }
    }

    .view-all {
      font-size: var(--text-xs); color: var(--primary-600); text-decoration: none; font-weight: 500;
      &:hover { text-decoration: underline; }
    }

    .dist-list { display: flex; flex-direction: column; gap: var(--space-4); }
    .dist-item { display: flex; align-items: center; gap: var(--space-3); }
    .dist-check {
      display: flex; align-items: center; cursor: pointer;
      input[type="checkbox"] { display: none; }
      input[type="checkbox"]:not(:checked) + .dist-color { opacity: 0.3; }
    }
    .dist-color { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; transition: opacity var(--transition-base); }
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

  statusFilters = [
    { key: 'POSITIVO', label: 'Positivos', color: '#2563EB', visible: true },
    { key: 'NEGATIVO', label: 'Negativos', color: '#DC2626', visible: true },
    { key: 'INDECISO', label: 'Indecisos', color: '#F59E0B', visible: true },
    { key: 'EN_BLANCO', label: 'En Blanco', color: '#6B7280', visible: true },
    { key: 'NO_TRABAJABLE', label: 'No Trabajables', color: '#1C1C1C', visible: true },
  ];

  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');

  chartWidth = 600;
  chartHeight = 180;
  chartDays = signal<string[]>([]);
  chartLines = signal<any[]>([]);
  yLabels = signal<string[]>([]);
  yGridLines = signal<number[]>([]);
  xLabelStep = signal(1);

  private statusColors: Record<string, string> = {
    'POSITIVO': '#2563EB',
    'NEGATIVO': '#DC2626',
    'INDECISO': '#F59E0B',
    'EN_BLANCO': '#6B7280',
    'NO_TRABAJABLE': '#1C1C1C',
    'PENDIENTE': '#8B5CF6',
    'REPROGRAMADA': '#0EA5E9',
    'RECHAZADA': '#BE123C',
    'FINALIZADA': '#059669',
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    const hoy = new Date();
    const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    this.fechaDesde.set(this.formatDate(primerDiaMesPasado));
    this.fechaHasta.set(this.formatDate(hoy));
    this.loadDashboard();
    this.cargarVisitasPorDia();
  }

  private formatDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadDashboard() {
    this.dashboardService.obtenerDashboard().subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.dashboard.set(response.datos);
          this.buildKPIs();
        }
      }
    });
  }

  private rawChartData: any[] = [];

  cargarVisitasPorDia() {
    this.dashboardService.obtenerVisitasPorDia(this.fechaDesde() || undefined, this.fechaHasta() || undefined).subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.rawChartData = response.datos;
          this.buildLineChart(response.datos);
        }
      }
    });
  }

  onFechaDesdeChange(value: string) { this.fechaDesde.set(value); }
  onFechaHastaChange(value: string) { this.fechaHasta.set(value); }

  aplicarFechas() { this.cargarVisitasPorDia(); }

  toggleStatusFilter(key: string) {
    const f = this.statusFilters.find(s => s.key === key);
    if (f) {
      f.visible = !f.visible;
      this.buildKPIs();
      this.buildLineChartFromData();
    }
  }

  isStatusVisible(key: string): boolean {
    return this.statusFilters.find(s => s.key === key)?.visible ?? true;
  }

  buildLineChartFromData() {
    this.buildLineChart(this.rawChartData);
  }

  getStatusColor(estado: string): string {
    return this.statusColors[estado] || '#6B7280';
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
      { key: 'POSITIVO', label: 'Positivos', value: () => d.positivos || 0, color: '#2563EB' },
      { key: 'NEGATIVO', label: 'Negativos', value: () => d.negativos || 0, color: '#DC2626' },
      { key: 'INDECISO', label: 'Indecisos', value: () => d.indecisos || 0, color: '#F59E0B' },
      { key: 'EN_BLANCO', label: 'En Blanco', value: () => d.enBlanco || 0, color: '#6B7280' },
      { key: 'NO_TRABAJABLE', label: 'No Trabajables', value: () => d.noTrabajables || 0, color: '#1C1C1C' },
    ].filter(s => this.isStatusVisible(s.key));

    this.distributions = [
      { key: 'POSITIVO', label: 'Positivos', value: () => d.positivos || 0, color: '#2563EB' },
      { key: 'NEGATIVO', label: 'Negativos', value: () => d.negativos || 0, color: '#DC2626' },
      { key: 'INDECISO', label: 'Indecisos', value: () => d.indecisos || 0, color: '#F59E0B' },
      { key: 'EN_BLANCO', label: 'En Blanco', value: () => d.enBlanco || 0, color: '#6B7280' },
      { key: 'NO_TRABAJABLE', label: 'No Trabajables', value: () => d.noTrabajables || 0, color: '#1C1C1C' },
    ].filter(s => this.isStatusVisible(s.key));
  }

  private buildLineChart(data: any[]) {
    if (!data || data.length === 0) {
      this.chartDays.set([]);
      this.chartLines.set([]);
      return;
    }

    const dateSet = new Set<string>();
    data.forEach((d: any) => dateSet.add(d.fecha));
    const dates = Array.from(dateSet).sort();
    this.chartDays.set(dates);
    this.xLabelStep.set(Math.max(1, Math.floor(dates.length / 7)));

    const estados = new Set<string>();
    data.forEach((d: any) => {
      if (this.isStatusVisible(d.estado)) {
        estados.add(d.estado);
      }
    });

    const estadoData = new Map<string, Map<string, number>>();
    estados.forEach(e => {
      const map = new Map<string, number>();
      dates.forEach(d => map.set(d, 0));
      estadoData.set(e, map);
    });
    data.forEach((d: any) => {
      estadoData.get(d.estado)?.set(d.fecha, d.total);
    });

    let maxVal = 1;
    estadoData.forEach((map) => {
      map.forEach(v => { if (v > maxVal) maxVal = v; });
    });
    maxVal = Math.ceil(maxVal * 1.15);

    const ySteps = 5;
    const yLbls: string[] = [];
    const yGl: number[] = [];
    for (let i = ySteps; i >= 0; i--) {
      yLbls.push(String(Math.round((maxVal / ySteps) * i)));
      yGl.push(Math.round((this.chartHeight / ySteps) * i));
    }
    this.yLabels.set(yLbls);
    this.yGridLines.set(yGl);

    const padding = 8;
    const w = this.chartWidth - padding * 2;
    const h = this.chartHeight - padding * 2;
    const xStep = dates.length > 1 ? w / (dates.length - 1) : w;

    const lines: any[] = [];
    estadoData.forEach((map, estado) => {
      const points: string[] = [];
      const dots: { x: number; y: number }[] = [];
      let idx = 0;
      map.forEach((val) => {
        const x = padding + idx * xStep;
        const y = padding + h - (val / maxVal) * h;
        points.push(`${x},${y}`);
        dots.push({ x, y });
        idx++;
      });
      lines.push({
        estado,
        color: this.statusColors[estado] || '#6B7280',
        points: points.join(' '),
        dots
      });
    });
    this.chartLines.set(lines);
  }

  getDistPercent(value: number): number {
    const total = (this.dashboard()?.totalPredios || 1);
    return Math.min((value / total) * 100, 100);
  }
}
