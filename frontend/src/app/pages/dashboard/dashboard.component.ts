import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { PredioService } from '../../core/services/predio.service';
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
        </div>
      </div>

      <!-- Secondary KPIs -->
      <div class="secondary-grid">
        <div class="mini-kpi" *ngFor="let mkpi of secondaryKpis" [style.opacity]="isStatusVisible(mkpi.key) ? 1 : 0.3">
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
          <div class="card-premium-header clickable" (click)="toggleCard('chart')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().chart ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Visitas</span>
            <div class="chart-controls" (click)="$event.stopPropagation()">
              <div class="chart-controls-row">
                <div class="chart-mode-toggle">
                  <button [class.active]="chartMode() === 'dia'" (click)="setChartMode('dia')">Día</button>
                  <button [class.active]="chartMode() === 'semana'" (click)="setChartMode('semana')">Semana</button>
                  <button [class.active]="chartMode() === 'mes'" (click)="setChartMode('mes')">Mes</button>
                </div>
                <div class="date-filters">
                  <label>Desde: <input type="date" [ngModel]="fechaDesde()" (ngModelChange)="onFechaDesdeChange($event)" autocomplete="off"></label>
                  <label>Hasta: <input type="date" [ngModel]="fechaHasta()" (ngModelChange)="onFechaHastaChange($event)" autocomplete="off"></label>
                  <button class="filter-btn" (click)="aplicarFechas()">Aplicar</button>
                </div>
                <div class="chart-action-btns">
                  <button class="icon-btn curve-btn" [class.active]="chartCurved()" (click)="toggleCurve()" title="Líneas curvas">
                    <i class="bi" [ngClass]="chartCurved() ? 'bi-bezier2' : 'bi-graph-up'"></i>
                  </button>
                  <button class="icon-btn maximize-btn" (click)="chartMaximized.set(true)" title="Maximizar gráfico">
                    <i class="bi bi-fullscreen"></i>
                  </button>
                </div>
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
          <div class="card-premium-body" *ngIf="cardsState().chart">
            <div class="chart-scroll-wrapper">
              <div class="line-chart" [style.width.px]="chartScrollWidth()" *ngIf="chartDays().length > 0">
                <div class="chart-y-axis">
                  <span *ngFor="let v of yLabels()">{{ v }}</span>
                </div>
                <div class="chart-area">
                  <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" preserveAspectRatio="none" class="chart-svg">
                    <line *ngFor="let y of yGridLines()" [attr.x1]="0" [attr.y1]="y" [attr.x2]="chartWidth" [attr.y2]="y" class="grid-line"/>
                    <ng-container *ngIf="!chartCurved()">
                      <polyline *ngFor="let line of chartLines()" [attr.points]="line.points" [attr.stroke]="line.color" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </ng-container>
                    <ng-container *ngIf="chartCurved()">
                      <path *ngFor="let line of chartLines()" [attr.d]="line.path" [attr.stroke]="line.color" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </ng-container>
                    <g *ngFor="let line of chartLines()">
                      <circle *ngFor="let pt of line.dots; let i = index" [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" [attr.fill]="line.color" class="chart-dot"/>
                      <text *ngFor="let pt of line.dots; let i = index" [attr.x]="pt.x" [attr.y]="pt.y - 8" [attr.fill]="line.color" class="chart-label" text-anchor="middle">{{ line.values[i] }}</text>
                    </g>
                  </svg>
                  <div class="chart-x-axis">
                    <span *ngFor="let d of chartDays(); let i = index" [class.visible]="i % xLabelStep() === 0">{{ d }}</span>
                  </div>
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
          <div class="card-premium-header clickable" (click)="toggleCard('dist')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().dist ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Distribución</span>
          </div>
          <div class="card-premium-body" *ngIf="cardsState().dist">
            <div class="dist-list">
              <div class="dist-item" *ngFor="let d of distributions" [style.opacity]="isStatusVisible(d.key) ? 1 : 0.3">
                <label class="dist-check">
                  <input type="checkbox" [checked]="isStatusVisible(d.key)" (change)="toggleStatusFilter(d.key)">
                  <span class="dist-color" [style.background]="d.color"></span>
                </label>
                <span class="dist-label">{{ d.label }}</span>
                <span class="dist-value clickable-dist" (click)="openPrediosModal(d.key)">{{ d.value() }}</span>
                <div class="dist-bar">
                  <div class="dist-bar-fill" [style.width.%]="getDistPercent(d.value())" [style.background]="d.color"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Rutas Positivos -->
        <div class="card-premium routes-positivos">
          <div class="card-premium-header clickable" (click)="toggleCard('routesPos')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().routesPos ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Rutas con más Positivos</span>
          </div>
          <div class="card-premium-body no-padding" *ngIf="cardsState().routesPos">
            <div class="routes-list">
              <div class="route-item" *ngFor="let r of topPositivos(); let i = index" (click)="irAManzana(r.idManzana)">
                <span class="route-rank">{{ i + 1 }}</span>
                <div class="route-info">
                  <span class="route-name">{{ r.nombre }}</span>
                  <span class="route-count">{{ r.total }} positivos</span>
                </div>
                <i class="bi bi-box-arrow-up-right route-link"></i>
              </div>
              <div class="routes-empty" *ngIf="topPositivos().length === 0">
                <span>No hay datos disponibles</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Rutas AR/Estrellas -->
        <div class="card-premium routes-ar">
          <div class="card-premium-header clickable" (click)="toggleCard('routesAR')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().routesAR ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Rutas con más AR y Estrellas</span>
          </div>
          <div class="card-premium-body no-padding" *ngIf="cardsState().routesAR">
            <div class="routes-list">
              <div class="route-item" *ngFor="let r of topArEstrellas(); let i = index" (click)="irAManzana(r.idManzana)">
                <span class="route-rank">{{ i + 1 }}</span>
                <div class="route-info">
                  <span class="route-name">{{ r.nombre }}</span>
                  <span class="route-count">
                    <i class="bi bi-person-check" style="color:#2563EB"></i> {{ r.arCount }}
                    <i class="bi bi-star-fill" style="color:#F59E0B;margin-left:8px"></i> {{ r.estrellaCount }}
                  </span>
                </div>
                <i class="bi bi-box-arrow-up-right route-link"></i>
              </div>
              <div class="routes-empty" *ngIf="topArEstrellas().length === 0">
                <span>No hay datos disponibles</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card-premium activity-card">
          <div class="card-premium-header clickable" (click)="toggleCard('activity')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().activity ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Actividad Reciente</span>
            <a class="view-all" routerLink="/visitas" (click)="$event.stopPropagation()">Ver todo</a>
          </div>
          <div class="card-premium-body no-padding scrollable-body" *ngIf="cardsState().activity">
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

        <!-- Estadísticas por Grupo -->
        <div class="card-premium grupo-stats-card">
          <div class="card-premium-header clickable" (click)="toggleCard('grupoStats')">
            <span class="card-premium-title"><i class="bi" [ngClass]="cardsState().grupoStats ? 'bi-chevron-down' : 'bi-chevron-right'"></i> Visitas por Grupo</span>
          </div>
          <div class="card-premium-body no-padding scrollable-body" *ngIf="cardsState().grupoStats">
            <div class="grupo-stats-list">
              <div class="grupo-stats-item" *ngFor="let g of grupoStats(); let i = index">
                <div class="grupo-header">
                  <span class="grupo-rank">{{ i + 1 }}</span>
                  <div class="grupo-info">
                    <span class="grupo-name">{{ g.grupo }}</span>
                    <span class="grupo-total">{{ g.total }} visitas</span>
                  </div>
                </div>
                <div class="grupo-bars">
                  <div class="grupo-bar" *ngIf="g.positivos > 0" [style.width.%]="getGrupoBarPercent(g.positivos, g.total)" style="background:#2563EB" title="Positivos: {{ g.positivos }}">
                    <span class="bar-num" *ngIf="g.positivos > g.total * 0.1">{{ g.positivos }}</span>
                  </div>
                  <div class="grupo-bar" *ngIf="g.negativos > 0" [style.width.%]="getGrupoBarPercent(g.negativos, g.total)" style="background:#DC2626" title="Negativos: {{ g.negativos }}">
                    <span class="bar-num" *ngIf="g.negativos > g.total * 0.1">{{ g.negativos }}</span>
                  </div>
                  <div class="grupo-bar" *ngIf="g.indecisos > 0" [style.width.%]="getGrupoBarPercent(g.indecisos, g.total)" style="background:#F59E0B" title="Indecisos: {{ g.indecisos }}">
                    <span class="bar-num" *ngIf="g.indecisos > g.total * 0.1">{{ g.indecisos }}</span>
                  </div>
                  <div class="grupo-bar" *ngIf="g.enBlanco > 0" [style.width.%]="getGrupoBarPercent(g.enBlanco, g.total)" style="background:#6B7280" title="En Blanco: {{ g.enBlanco }}">
                    <span class="bar-num" *ngIf="g.enBlanco > g.total * 0.1">{{ g.enBlanco }}</span>
                  </div>
                  <div class="grupo-bar" *ngIf="g.noTrabajables > 0" [style.width.%]="getGrupoBarPercent(g.noTrabajables, g.total)" style="background:#1C1C1C" title="No Trabajables: {{ g.noTrabajables }}">
                    <span class="bar-num" *ngIf="g.noTrabajables > g.total * 0.1">{{ g.noTrabajables }}</span>
                  </div>
                </div>
                <div class="grupo-legend">
                  <span *ngIf="g.positivos > 0"><span class="legend-dot-sm" style="background:#2563EB"></span>{{ g.positivos }}</span>
                  <span *ngIf="g.negativos > 0"><span class="legend-dot-sm" style="background:#DC2626"></span>{{ g.negativos }}</span>
                  <span *ngIf="g.indecisos > 0"><span class="legend-dot-sm" style="background:#F59E0B"></span>{{ g.indecisos }}</span>
                  <span *ngIf="g.enBlanco > 0"><span class="legend-dot-sm" style="background:#6B7280"></span>{{ g.enBlanco }}</span>
                  <span *ngIf="g.noTrabajables > 0"><span class="legend-dot-sm" style="background:#1C1C1C"></span>{{ g.noTrabajables }}</span>
                </div>
                <div class="grupo-meta">
                  <span><i class="bi bi-person-check" style="color:#2563EB"></i> {{ g.apoyosAlcalde }}</span>
                  <span><i class="bi bi-star-fill" style="color:#F59E0B"></i> {{ g.estrellas }}</span>
                </div>
              </div>
              <div class="routes-empty" *ngIf="grupoStats().length === 0">
                <span>No hay datos de grupos disponibles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Predios por Estado -->
    <div class="predios-modal-overlay" *ngIf="showPrediosModal()" (click)="showPrediosModal.set(false)">
      <div class="predios-modal" (click)="$event.stopPropagation()">
        <div class="predios-modal-header">
          <h3><i class="bi bi-list-ul"></i> {{ prediosModalTitle() }}</h3>
          <button class="modal-close-btn" (click)="showPrediosModal.set(false)"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="predios-modal-body">
          <div class="predios-table-scroll" *ngIf="prediosModalData().length > 0">
            <table class="predios-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th class="sortable" (click)="togglePrediosSort('claveCatastral')">Clave Catastral <i class="bi" [ngClass]="prediosSortIcon('claveCatastral')"></i></th>
                  <th class="sortable" (click)="togglePrediosSort('propietario')">Propietario <i class="bi" [ngClass]="prediosSortIcon('propietario')"></i></th>
                  <th class="sortable" (click)="togglePrediosSort('direccion')">Dirección <i class="bi" [ngClass]="prediosSortIcon('direccion')"></i></th>
                  <th class="sortable" (click)="togglePrediosSort('estadoVisita')">Estado <i class="bi" [ngClass]="prediosSortIcon('estadoVisita')"></i></th>
                  <th class="sortable" (click)="togglePrediosSort('fechaCreacion')">Fecha <i class="bi" [ngClass]="prediosSortIcon('fechaCreacion')"></i></th>
                  <th>AR</th>
                  <th>Estrella</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of prediosModalSorted(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td><code>{{ p.claveCatastral }}</code></td>
                  <td>{{ p.propietario }}</td>
                  <td>{{ p.direccion }}</td>
                  <td>
                    <span class="badge-premium" [style.background]="getStatusColor(p.estadoVisita)" style="color:#fff">{{ p.estadoVisita }}</span>
                  </td>
                  <td>{{ p.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><i class="bi bi-person-check" *ngIf="p.apoyaAlcalde" style="color:#2563EB"></i></td>
                  <td><i class="bi bi-star-fill" *ngIf="p.estrella" style="color:#F59E0B"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="chart-empty" *ngIf="prediosModalData().length === 0">
            <i class="bi bi-inbox"></i>
            <span>No hay predios para este filtro</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Maximizado -->
    <div class="chart-modal-overlay" *ngIf="chartMaximized()" (click)="chartMaximized.set(false)">
      <div class="chart-modal" (click)="$event.stopPropagation()">
        <div class="chart-modal-header">
          <h3><i class="bi bi-graph-up"></i> Visitas por Día</h3>
          <div class="chart-modal-controls">
            <button class="icon-btn curve-btn" [class.active]="chartCurved()" (click)="toggleCurve()" title="Líneas curvas">
              <i class="bi" [ngClass]="chartCurved() ? 'bi-bezier2' : 'bi-graph-up'"></i>
            </button>
            <div class="date-filters">
              <label>Desde: <input type="date" [ngModel]="fechaDesde()" (ngModelChange)="onFechaDesdeChange($event)" autocomplete="off"></label>
              <label>Hasta: <input type="date" [ngModel]="fechaHasta()" (ngModelChange)="onFechaHastaChange($event)" autocomplete="off"></label>
              <button class="filter-btn" (click)="aplicarFechas()">Aplicar</button>
            </div>
            <button class="modal-close-btn" (click)="chartMaximized.set(false)"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="chart-modal-body">
          <div class="chart-legend modal-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#2563EB"></span>Positivo</span>
            <span class="legend-item"><span class="legend-dot" style="background:#DC2626"></span>Negativo</span>
            <span class="legend-item"><span class="legend-dot" style="background:#F59E0B"></span>Indeciso</span>
            <span class="legend-item"><span class="legend-dot" style="background:#6B7280"></span>En Blanco</span>
            <span class="legend-item"><span class="legend-dot" style="background:#1C1C1C"></span>No Trabajable</span>
          </div>
          <div class="chart-scroll-wrapper modal-chart-scroll">
            <div class="line-chart modal-line-chart" [style.width.px]="chartScrollWidth()" *ngIf="chartDays().length > 0">
              <div class="chart-y-axis">
                <span *ngFor="let v of yLabels()">{{ v }}</span>
              </div>
              <div class="chart-area">
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" preserveAspectRatio="none" class="chart-svg">
                  <line *ngFor="let y of yGridLines()" [attr.x1]="0" [attr.y1]="y" [attr.x2]="chartWidth" [attr.y2]="y" class="grid-line"/>
                  <ng-container *ngIf="!chartCurved()">
                    <polyline *ngFor="let line of chartLines()" [attr.points]="line.points" [attr.stroke]="line.color" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </ng-container>
                  <ng-container *ngIf="chartCurved()">
                    <path *ngFor="let line of chartLines()" [attr.d]="line.path" [attr.stroke]="line.color" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </ng-container>
                  <g *ngFor="let line of chartLines()">
                    <circle *ngFor="let pt of line.dots; let i = index" [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" [attr.fill]="line.color" class="chart-dot"/>
                    <text *ngFor="let pt of line.dots; let i = index" [attr.x]="pt.x" [attr.y]="pt.y - 8" [attr.fill]="line.color" class="chart-label" text-anchor="middle">{{ line.values[i] }}</text>
                  </g>
                </svg>
                <div class="chart-x-axis">
                  <span *ngFor="let d of chartDays(); let i = index" [class.visible]="true">{{ d }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-empty" *ngIf="chartDays().length === 0">
            <i class="bi bi-bar-chart-line"></i>
            <span>No hay datos de visitas por día</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeIn 0.3s ease-out; }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-4);
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
      display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto;
      gap: var(--space-4);
    }
    .chart-card { grid-column: 1 / -1; grid-row: 1; }
    .dist-card { grid-column: 1; grid-row: 2; }
    .grupo-stats-card { grid-column: 2; grid-row: 2; }
    .routes-positivos { grid-column: 1; grid-row: 3; }
    .routes-ar { grid-column: 2; grid-row: 3; }
    .activity-card { grid-column: 1 / -1; grid-row: 4; }

    .clickable { cursor: pointer; user-select: none; }
    .clickable:hover { background: var(--bg-hover); }

    .chart-controls { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-end; }
    .chart-controls-row { display: flex; align-items: center; gap: var(--space-3); flex-wrap: nowrap; }
    .chart-action-btns { display: flex; align-items: center; gap: 4px; }
    .icon-btn {
      width: 28px; height: 28px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      background: var(--bg-surface); color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
      transition: all var(--transition-fast);
      &:hover { background: var(--primary-50); color: var(--primary-600); border-color: var(--primary-300); }
      &.active { background: var(--primary-600); color: #fff; border-color: var(--primary-600); }
    }
    .chart-mode-toggle {
      display: flex; gap: 2px; background: var(--neutral-100); border-radius: var(--radius-sm); padding: 2px;
      button {
        padding: 2px 12px; border: none; background: transparent; border-radius: var(--radius-sm);
        font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); cursor: pointer;
        transition: all var(--transition-fast);
        &.active { background: var(--primary-600); color: #fff; }
        &:hover:not(.active) { background: var(--bg-hover); }
      }
    }
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

    .chart-scroll-wrapper { overflow-x: auto; overflow-y: hidden; }
    .line-chart { display: flex; gap: var(--space-2); height: 220px; padding: var(--space-2) 0; min-width: 100%; }
    .chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; padding: 0 var(--space-1); min-width: 30px; text-align: right; }
    .chart-y-axis span { font-size: 0.625rem; color: var(--text-tertiary); line-height: 1; }
    .chart-area { flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }
    .chart-svg { width: 100%; flex: 1; }
    .grid-line { stroke: var(--border-light); stroke-width: 0.5; stroke-dasharray: 4,4; }
    .chart-dot { opacity: 0; transition: opacity 0.15s; }
    .chart-svg:hover .chart-dot { opacity: 1; }
    .chart-label { font-size: 9px; font-weight: 600; opacity: 0; transition: opacity 0.15s; pointer-events: none; }
    .chart-svg:hover .chart-label { opacity: 1; }
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

    .routes-list { display: flex; flex-direction: column; max-height: 280px; overflow-y: auto; }
    .route-item {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      &:last-child { border-bottom: none; }
    }
    .route-rank {
      width: 24px; height: 24px; border-radius: 50%; background: var(--primary-50); color: var(--primary-700);
      display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; flex-shrink: 0;
    }
    .route-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .route-name { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .route-count { font-size: var(--text-xs); color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
    .route-link { font-size: var(--text-xs); color: var(--text-tertiary); flex-shrink: 0; }
    .routes-empty { padding: var(--space-6); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm); }

    .no-padding { padding: 0 !important; }
    .scrollable-body { max-height: 300px; overflow-y: auto; }
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

    .mini-map-container { height: 260px; width: 100%; }

    .grupo-stats-list { display: flex; flex-direction: column; }
    .grupo-stats-item {
      padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-light);
      &:last-child { border-bottom: none; }
    }
    .grupo-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
    .grupo-rank {
      width: 24px; height: 24px; border-radius: 50%; background: var(--primary-50); color: var(--primary-700);
      display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; flex-shrink: 0;
    }
    .grupo-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .grupo-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .grupo-total { font-size: var(--text-xs); color: var(--text-secondary); }
    .grupo-bars { display: flex; gap: 2px; height: 6px; border-radius: 3px; overflow: hidden; background: var(--neutral-100); margin-bottom: var(--space-2); }
    .grupo-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; min-width: 2px; }
    .grupo-meta { display: flex; gap: var(--space-3); font-size: var(--text-xs); color: var(--text-secondary);
      span { display: flex; align-items: center; gap: 3px; }
    }

    .chart-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 3000;
      animation: fadeIn 0.2s ease-out;
    }
    .chart-modal {
      background: var(--bg-surface); border-radius: var(--radius-xl); width: 92vw; height: 85vh;
      display: flex; flex-direction: column; box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.2s ease-out;
    }
    .chart-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-light);
      h3 { margin: 0; font-size: var(--text-lg); font-weight: 600; display: flex; align-items: center; gap: var(--space-2);
        i { color: var(--primary-600); }
      }
    }
    .chart-modal-controls { display: flex; align-items: center; gap: var(--space-4); }
    .modal-close-btn {
      width: 32px; height: 32px; border: none; border-radius: var(--radius-md);
      background: transparent; color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }
    .chart-modal-body { flex: 1; padding: var(--space-4) var(--space-6); overflow: hidden; display: flex; flex-direction: column; }
    .modal-legend { margin-bottom: var(--space-3); justify-content: center; }
    .modal-chart-scroll { flex: 1; overflow-x: auto; }
    .modal-line-chart { min-height: 300px; }

    .predios-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 3000;
      animation: fadeIn 0.2s ease-out;
    }
    .predios-modal {
      background: var(--bg-surface); border-radius: var(--radius-xl); width: 90vw; max-width: 900px; max-height: 80vh;
      display: flex; flex-direction: column; box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.2s ease-out;
    }
    .predios-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-light);
      h3 { margin: 0; font-size: var(--text-lg); font-weight: 600; display: flex; align-items: center; gap: var(--space-2);
        i { color: var(--primary-600); }
      }
    }
    .predios-modal-body { flex: 1; padding: var(--space-4) var(--space-6); overflow: hidden; }
    .predios-table-scroll { max-height: 60vh; overflow-y: auto; }
    .predios-table { width: 100%; border-collapse: separate; border-spacing: 0;
      thead th { position: sticky; top: 0; z-index: 1; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; }
      tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } }
      tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; }
    }
    .predios-table .sortable { cursor: pointer; user-select: none; &:hover { color: var(--primary-600); } i { font-size: 0.625rem; margin-left: 2px; } }

    .clickable-dist { cursor: pointer; text-decoration: underline; text-decoration-style: dotted; &:hover { color: var(--primary-600); } }

    .grupo-legend { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-secondary);
      span { display: flex; align-items: center; gap: 3px; }
    }
    .legend-dot-sm { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .bar-num { font-size: 8px; color: #fff; font-weight: 600; display: flex; align-items: center; justify-content: center; height: 100%; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1200px) { .kpi-grid, .secondary-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } .dist-card, .grupo-stats-card, .routes-positivos, .routes-ar, .activity-card { grid-column: 1; grid-row: auto; } }
    @media (max-width: 768px) { .kpi-grid, .secondary-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  dashboard = signal<Dashboard | null>(null);
  grupoStats = signal<any[]>([]);

  chartMaximized = signal(false);
  chartMode = signal<'dia' | 'semana' | 'mes'>('dia');
  chartCurved = signal(true);

  showPrediosModal = signal(false);
  prediosModalTitle = signal('');
  prediosModalData = signal<any[]>([]);

  prediosSortField = signal('');
  prediosSortDir = signal<'asc'|'desc'>('asc');

  prediosModalSorted = computed(() => {
    const data = [...this.prediosModalData()];
    const field = this.prediosSortField();
    const dir = this.prediosSortDir();
    if (!field) return data;
    return data.sort((a: any, b: any) => {
      let va = a[field] ?? '';
      let vb = b[field] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  kpis: any[] = [];
  secondaryKpis: any[] = [];
  distributions: any[] = [];
  topPositivos = signal<any[]>([]);
  topArEstrellas = signal<any[]>([]);

  cardsState = signal({
    chart: true,
    dist: true,
    routesPos: true,
    routesAR: true,
    activity: true,
    grupoStats: true,
  });

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
  chartScrollWidth = signal(600);

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

  constructor(private dashboardService: DashboardService, private predioService: PredioService, private router: Router) {}

  ngOnInit() {
    const hoy = new Date();
    const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    this.fechaDesde.set(this.formatDate(primerDiaMesPasado));
    this.fechaHasta.set(this.formatDate(hoy));
    this.loadDashboard();
    this.cargarVisitasPorDia();
    this.loadTopRutas();
    this.loadGrupoStats();
  }

  private formatDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  toggleCard(key: string) {
    this.cardsState.update(s => ({ ...s, [key]: !s[key as keyof typeof s] }));
  }

  irAManzana(idManzana: number) {
    this.router.navigate(['/mapa'], { queryParams: { type: 'manzana', id: idManzana } });
  }

  loadDashboard() {
    this.dashboardService.obtenerDashboard().subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.dashboard.set(response.datos);
          this.buildKPIs();
        }
      },
      error: () => {}
    });
  }

  loadTopRutas() {
    this.dashboardService.topManzanasPositivos().subscribe({
      next: (r) => { if (r.exitoso) this.topPositivos.set(r.datos || []); },
      error: () => {}
    });
    this.dashboardService.topManzanasArEstrellas().subscribe({
      next: (r) => { if (r.exitoso) this.topArEstrellas.set(r.datos || []); },
      error: () => {}
    });
  }

  private rawChartData: any[] = [];

  cargarVisitasPorDia() {
    const desde = this.fechaDesde() || undefined;
    const hasta = this.fechaHasta() || undefined;
    const mode = this.chartMode();
    let obs;
    if (mode === 'semana') {
      obs = this.dashboardService.obtenerVisitasPorSemana(desde, hasta);
    } else if (mode === 'mes') {
      obs = this.dashboardService.obtenerVisitasPorMes(desde, hasta);
    } else {
      obs = this.dashboardService.obtenerVisitasPorDia(desde, hasta);
    }
    obs.subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.rawChartData = response.datos;
          this.buildLineChart(response.datos);
        }
      },
      error: () => {}
    });
  }

  onFechaDesdeChange(value: string) { this.fechaDesde.set(value); }
  onFechaHastaChange(value: string) { this.fechaHasta.set(value); }

  aplicarFechas() { this.cargarVisitasPorDia(); }

  setChartMode(mode: 'dia' | 'semana' | 'mes') {
    this.chartMode.set(mode);
    this.cargarVisitasPorDia();
  }

  toggleCurve() {
    this.chartCurved.set(!this.chartCurved());
    this.buildLineChart(this.rawChartData);
  }

  loadGrupoStats() {
    this.dashboardService.obtenerStatsPorGrupo().subscribe({
      next: (r) => { if (r.exitoso) this.grupoStats.set(r.datos || []); },
      error: () => { this.grupoStats.set([]); }
    });
  }

  getGrupoBarPercent(value: number, total: number): number {
    return total > 0 ? Math.min((value / total) * 100, 100) : 0;
  }

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

  togglePrediosSort(field: string) {
    if (this.prediosSortField() === field) {
      this.prediosSortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.prediosSortField.set(field);
      this.prediosSortDir.set('asc');
    }
  }

  prediosSortIcon(field: string): string {
    if (this.prediosSortField() !== field) return 'bi-arrow-down-up';
    return this.prediosSortDir() === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  openPrediosModal(estado: string) {
    const labels: Record<string, string> = {
      'POSITIVO': 'Positivos', 'NEGATIVO': 'Negativos', 'INDECISO': 'Indecisos',
      'EN_BLANCO': 'En Blanco', 'NO_TRABAJABLE': 'No Trabajables',
      'PENDIENTE': 'Pendientes', 'REPROGRAMADA': 'Reprogramadas'
    };
    this.prediosModalTitle.set(`Predios — ${labels[estado] || estado}`);
    this.showPrediosModal.set(true);
    this.dashboardService.obtenerPrediosPorEstado(estado).subscribe({
      next: (r) => { if (r.exitoso) this.prediosModalData.set(r.datos || []); },
      error: () => { this.prediosModalData.set([]); }
    });
  }

  buildKPIs() {
    const d = this.dashboard()!;
    this.kpis = [
      { label: 'Manzanas', value: () => d.totalManzanas || 0, icon: 'bi-grid-3x3', bg: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' },
      { label: 'Predios', value: () => d.totalPredios || 0, icon: 'bi-house-door', bg: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))' },
      { label: 'Visitas', value: () => d.totalVisitas || 0, icon: 'bi-clipboard-check', bg: 'linear-gradient(135deg, var(--info-500), var(--info-600))' },
      { label: 'Cobertura', value: () => (d.porcentajeCobertura || 0).toFixed(1) + '%', icon: 'bi-percent', bg: 'linear-gradient(135deg, var(--warning-500), var(--warning-600))' },
      { label: 'Apoya Alcalde', value: () => d.apoyosAlcalde || 0, icon: 'bi-person-check', bg: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
      { label: 'Estrellas', value: () => d.estrellas || 0, icon: 'bi-star-fill', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
    ];

    this.secondaryKpis = [
      { key: 'POSITIVO', label: 'Positivos', value: () => d.positivos || 0, color: '#2563EB' },
      { key: 'NEGATIVO', label: 'Negativos', value: () => d.negativos || 0, color: '#DC2626' },
      { key: 'INDECISO', label: 'Indecisos', value: () => d.indecisos || 0, color: '#F59E0B' },
      { key: 'EN_BLANCO', label: 'En Blanco', value: () => d.enBlanco || 0, color: '#6B7280' },
      { key: 'NO_TRABAJABLE', label: 'No Trabajables', value: () => d.noTrabajables || 0, color: '#1C1C1C' },
    ];

    this.distributions = [
      { key: 'POSITIVO', label: 'Positivos', value: () => d.positivos || 0, color: '#2563EB' },
      { key: 'NEGATIVO', label: 'Negativos', value: () => d.negativos || 0, color: '#DC2626' },
      { key: 'INDECISO', label: 'Indecisos', value: () => d.indecisos || 0, color: '#F59E0B' },
      { key: 'EN_BLANCO', label: 'En Blanco', value: () => d.enBlanco || 0, color: '#6B7280' },
      { key: 'NO_TRABAJABLE', label: 'No Trabajables', value: () => d.noTrabajables || 0, color: '#1C1C1C' },
    ];
  }

  private buildLineChart(data: any[]) {
    if (!data || data.length === 0) {
      this.chartDays.set([]);
      this.chartLines.set([]);
      this.chartScrollWidth.set(600);
      return;
    }

    const mode = this.chartMode();
    const dateSet = new Set<string>();
    data.forEach((d: any) => {
      if (mode === 'semana') {
        dateSet.add(`S${d.semana}-${d.anio}`);
      } else if (mode === 'mes') {
        const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        dateSet.add(`${meses[(d.mes || 1) - 1]}-${d.anio}`);
      } else {
        dateSet.add(d.fecha);
      }
    });
    const dates = Array.from(dateSet).sort();
    this.chartDays.set(dates);
    this.xLabelStep.set(Math.max(1, Math.floor(dates.length / 7)));

    const minChartWidth = 600;
    const widthPerDay = 50;
    this.chartScrollWidth.set(Math.max(minChartWidth, dates.length * widthPerDay));

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
      let key: string;
      if (mode === 'semana') {
        key = `S${d.semana}-${d.anio}`;
      } else if (mode === 'mes') {
        const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        key = `${meses[(d.mes || 1) - 1]}-${d.anio}`;
      } else {
        key = d.fecha;
      }
      estadoData.get(d.estado)?.set(key, d.total);
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
    const w = this.chartScrollWidth() - padding * 2;
    const h = this.chartHeight - padding * 2;
    const xStep = dates.length > 1 ? w / (dates.length - 1) : w;

    const lines: any[] = [];
    estadoData.forEach((map, estado) => {
      const points: string[] = [];
      const dots: { x: number; y: number }[] = [];
      const values: number[] = [];
      let idx = 0;
      map.forEach((val) => {
        const x = padding + idx * xStep;
        const y = padding + h - (val / maxVal) * h;
        points.push(`${x},${y}`);
        dots.push({ x, y });
        values.push(val);
        idx++;
      });
      lines.push({
        estado,
        color: this.statusColors[estado] || '#6B7280',
        points: points.join(' '),
        path: this.buildCurvedPath(dots),
        dots,
        values
      });
    });
    this.chartLines.set(lines);
  }

  getDistPercent(value: number): number {
    const total = (this.dashboard()?.totalPredios || 1);
    return Math.min((value / total) * 100, 100);
  }

  private buildCurvedPath(dots: { x: number; y: number }[]): string {
    if (dots.length < 2) return '';
    if (dots.length === 2) {
      return `M${dots[0].x},${dots[0].y} L${dots[1].x},${dots[1].y}`;
    }
    let d = `M${dots[0].x},${dots[0].y}`;
    for (let i = 0; i < dots.length - 1; i++) {
      const p0 = dots[Math.max(0, i - 1)];
      const p1 = dots[i];
      const p2 = dots[i + 1];
      const p3 = dots[Math.min(dots.length - 1, i + 2)];
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }
}
