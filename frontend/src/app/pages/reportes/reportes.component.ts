import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes</h1>
          <p class="page-subtitle">Generación y exportación de reportes del sistema</p>
        </div>
      </div>

      <!-- Report Type Selector -->
      <div class="reports-grid">
        <div class="report-card" *ngFor="let r of reports"
             [class.active]="selectedReport() === r.key"
             (click)="selectReport(r.key)">
          <div class="report-icon" [style.background]="r.bg"><i class="bi" [ngClass]="r.icon"></i></div>
          <h4 class="report-title">{{ r.title }}</h4>
          <p class="report-desc">{{ r.desc }}</p>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="card-premium filter-card" *ngIf="selectedReport()">
        <div class="card-premium-header">
          <span class="card-premium-title">
            <i class="bi bi-funnel"></i> Filtros — {{ getReportTitle() }}
          </span>
        </div>
        <div class="card-premium-body">
          <div class="filter-grid">
            <div class="form-field" *ngIf="showFechaInicio()">
              <label>Fecha Inicio</label>
              <input type="date" class="form-input" [(ngModel)]="fechaInicio" autocomplete="off">
            </div>
            <div class="form-field" *ngIf="showFechaFin()">
              <label>Fecha Fin</label>
              <input type="date" class="form-input" [(ngModel)]="fechaFin" autocomplete="off">
            </div>
            <div class="form-field" *ngIf="selectedReport() === 'mapa'">
              <label>Estado de Visita</label>
              <select class="form-input" [(ngModel)]="estadoFilter">
                <option value="">Todos</option>
                <option value="POSITIVO">Positivo</option>
                <option value="NEGATIVO">Negativo</option>
                <option value="INDECISO">Indeciso</option>
                <option value="EN_BLANCO">En Blanco</option>
                <option value="NO_TRABAJABLE">No Trabajable</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REPROGRAMADA">Reprogramada</option>
              </select>
            </div>
            <div class="form-field filter-actions">
              <button class="btn-generate" (click)="generarReporte()" [disabled]="loading()">
                <i class="bi" [ngClass]="loading() ? 'bi-arrow-repeat spin' : 'bi-file-earmark-bar-graph'"></i>
                {{ loading() ? 'Generando...' : 'Generar' }}
              </button>
              <button class="btn-export" *ngIf="reportData().length > 0" (click)="exportarExcel()" title="Exportar a Excel">
                <i class="bi bi-file-earmark-excel"></i> Excel
              </button>
              <button class="btn-export btn-pdf" *ngIf="reportData().length > 0" (click)="exportarPDF()" title="Exportar a PDF">
                <i class="bi bi-file-earmark-pdf"></i> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="card-premium results-card" *ngIf="reportData().length > 0">
        <div class="card-premium-header">
          <span class="card-premium-title">
            <i class="bi bi-table"></i> Resultados ({{ reportData().length }} registros)
          </span>
        </div>
        <div class="card-premium-body no-padding">
          <div class="table-responsive">
            <table class="table-premium">
              <thead>
                <tr>
                  <th *ngFor="let col of tableColumns(); let k = index" class="sortable" (click)="toggleSort(tableKeys()[k])">
                    {{ col }} <i class="bi" [ngClass]="sortIcon(tableKeys()[k])"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of reportDataSorted(); let i = index">
                  <td *ngFor="let col of tableKeys(); let k = index">
                    <span *ngIf="col === 'estadoVisita'" class="badge-premium"
                      [class.badge-success]="row[col] === 'POSITIVO'"
                      [class.badge-danger]="row[col] === 'NEGATIVO'"
                      [class.badge-warning]="row[col] === 'INDECISO'"
                      [class.badge-neutral]="row[col] === 'EN_BLANCO' || row[col] === 'NO_TRABAJABLE'">
                      {{ row[col] }}
                    </span>
                    <span *ngIf="col !== 'estadoVisita'">{{ row[col] || '-' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state-card" *ngIf="selectedReport() && !loading() && reportData().length === 0 && searched()">
        <i class="bi bi-inbox"></i>
        <p>No se encontraron datos para los filtros seleccionados</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }

    .reports-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .report-card {
      background: var(--bg-surface); border: 2px solid var(--border-default); border-radius: var(--radius-xl);
      padding: var(--space-5); text-align: center; cursor: pointer; transition: all var(--transition-base);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--primary-300); }
      &.active { border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); background: var(--primary-50); }
    }
    .report-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-3); i { font-size: 1.2rem; color: #fff; } }
    .report-title { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .report-desc { font-size: var(--text-xs); color: var(--text-secondary); margin: 0; }

    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); margin-bottom: var(--space-4); }
    .card-premium-header { padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
    .card-premium-title { font-size: var(--text-sm); font-weight: 600; display: flex; align-items: center; gap: var(--space-2); i { color: var(--primary-600); } }
    .card-premium-body { padding: var(--space-4) var(--space-5); }
    .no-padding { padding: 0 !important; }

    .filter-grid { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: nowrap; }
    .filter-actions { display: flex; gap: var(--space-2); align-items: flex-end; }
    .form-field { display: flex; flex-direction: column; gap: var(--space-1); flex-shrink: 0; label { font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); } }
    .form-input { height: 34px; padding: 0 var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-xs); color: var(--text-primary); background: var(--bg-surface); outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); } }
    .btn-generate { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-xs); font-weight: 500; cursor: pointer; height: 34px; white-space: nowrap; &:hover { background: var(--primary-700); } &:disabled { opacity: 0.6; } }
    .btn-export { display: flex; align-items: center; gap: var(--space-1); padding: 0 var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary); font-size: var(--text-xs); font-weight: 500; cursor: pointer; height: 34px; white-space: nowrap; &:hover { background: var(--bg-hover); } }
    .btn-pdf { border-color: var(--danger-500); color: var(--danger-600); &:hover { background: var(--danger-50); } }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .table-responsive { overflow-x: auto; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0;
      thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; }
      tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } }
      tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; }
    }
    .sortable { cursor: pointer; user-select: none; &:hover { color: var(--primary-600); } i { font-size: 0.625rem; margin-left: 2px; } }

    .badge-premium { display: inline-block; padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 500; white-space: nowrap; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-neutral { background: var(--neutral-100); color: var(--text-secondary); }

    .empty-state-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-12); color: var(--text-tertiary); background: var(--bg-surface); border: 1px dashed var(--border-default); border-radius: var(--radius-xl); i { font-size: 3rem; margin-bottom: var(--space-3); } p { font-size: var(--text-sm); } }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 1024px) { .reports-grid { grid-template-columns: repeat(2, 1fr); } .filter-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 640px) { .reports-grid { grid-template-columns: 1fr; } .filter-grid { grid-template-columns: 1fr; } }
  `]
})
export class ReportesComponent implements OnInit {
  selectedReport = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  reportData = signal<any[]>([]);
  tableColumns = signal<string[]>([]);
  tableKeys = signal<string[]>([]);

  sortField = signal('');
  sortDir = signal<'asc'|'desc'>('asc');

  reportDataSorted = computed(() => {
    const data = [...this.reportData()];
    const field = this.sortField();
    const dir = this.sortDir();
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

  fechaInicio = '';
  fechaFin = '';
  estadoFilter = '';

  reports = [
    { key: 'visitas-usuario', title: 'Visitas por Usuario', desc: 'Resumen de visitas realizadas por cada visitador', icon: 'bi-person-check', bg: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
    { key: 'visitas-sector', title: 'Visitas por Sector', desc: 'Distribución de visitas por sector geográfico', icon: 'bi-geo-alt', bg: 'linear-gradient(135deg, #059669, #047857)' },
    { key: 'predios-pendientes', title: 'Predios Pendientes', desc: 'Lista de predios que aún no han sido visitados', icon: 'bi-hourglass-split', bg: 'linear-gradient(135deg, #D97706, #B45309)' },
    { key: 'mapa-tematico', title: 'Mapa Temático', desc: 'Predios filtrados por estado de visita', icon: 'bi-map', bg: 'linear-gradient(135deg, #0EA5E9, #0284C7)' },
    { key: 'cobertura', title: 'Cobertura', desc: 'Porcentaje de cobertura general del sistema', icon: 'bi-pie-chart', bg: 'linear-gradient(135deg, #6B7280, #4B5563)' },
    { key: 'productividad', title: 'Productividad', desc: 'Estadísticas de productividad por grupo de brigada', icon: 'bi-graph-up', bg: 'linear-gradient(135deg, #DC2626, #B91C1C)' },
  ];

  constructor(private reporteService: ReporteService) {}

  ngOnInit() {
    const hoy = new Date();
    const hace1Mes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    this.fechaInicio = this.formatDate(hace1Mes);
    this.fechaFin = this.formatDate(hoy);
  }

  private formatDate(f: Date): string {
    return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}`;
  }

  selectReport(key: string) {
    this.selectedReport.set(key);
    this.reportData.set([]);
    this.searched.set(false);
    this.tableColumns.set([]);
    this.tableKeys.set([]);
  }

  getReportTitle(): string {
    return this.reports.find(r => r.key === this.selectedReport())?.title || '';
  }

  toggleSort(key: string) {
    if (this.sortField() === key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(key);
      this.sortDir.set('asc');
    }
  }

  sortIcon(key: string): string {
    if (this.sortField() !== key) return 'bi-arrow-down-up';
    return this.sortDir() === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  showFechaInicio(): boolean { return true; }
  showFechaFin(): boolean { return true; }

  generarReporte() {
    const key = this.selectedReport();
    if (!key) return;
    this.loading.set(true);
    this.searched.set(true);

    const fi = this.fechaInicio ? this.fechaInicio + 'T00:00:00' : '';
    const ff = this.fechaFin ? this.fechaFin + 'T23:59:59' : '';

    switch (key) {
      case 'visitas-usuario':
        this.reporteService.visitasPorUsuario(fi, ff).subscribe({
          next: (r) => {
            this.reportData.set(r.datos || []);
            this.tableColumns.set(['ID Usuario', 'Total Visitas']);
            this.tableKeys.set(['idUsuario', 'total']);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'visitas-sector':
        this.reporteService.visitasPorSector(fi, ff).subscribe({
          next: (r) => {
            this.reportData.set(r.datos || []);
            this.tableColumns.set(['Sector', 'Estado', 'Total']);
            this.tableKeys.set(['sector', 'estado', 'total']);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'predios-pendientes':
        this.reporteService.prediosPendientes('').subscribe({
          next: (r) => {
            const all = (r.datos as any)?.content || (Array.isArray(r.datos) ? r.datos : []);
            const pendientes = all.filter((p: any) => !p.estadoVisita);
            this.reportData.set(pendientes);
            this.tableColumns.set(['Clave Catastral', 'Propietario', 'Dirección', 'Manzana']);
            this.tableKeys.set(['claveCatastral', 'propietario', 'direccion', 'nombreManzana']);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'mapa-tematico':
        if (!this.estadoFilter) {
          this.reporteService.mapaTematico('POSITIVO').subscribe({
            next: (r) => this.loadDataMapa(r),
            error: () => this.loading.set(false)
          });
        } else {
          this.reporteService.mapaTematico(this.estadoFilter).subscribe({
            next: (r) => this.loadDataMapa(r),
            error: () => this.loading.set(false)
          });
        }
        break;
      case 'cobertura':
        this.reporteService.cobertura().subscribe({
          next: (r) => {
            const d = r.datos;
            this.reportData.set([{
              totalManzanas: d.totalManzanas,
              totalPredios: d.totalPredios,
              totalVisitas: d.totalVisitas,
              porcentajeCobertura: (d.porcentajeCobertura || 0).toFixed(1) + '%',
              positivos: d.positivos,
              negativos: d.negativos,
              indecisos: d.indecisos,
              noTrabajables: d.noTrabajables,
              apoyosAlcalde: d.apoyosAlcalde,
              estrellas: d.estrellas
            }]);
            this.tableColumns.set(['Manzanas', 'Predios', 'Visitas', 'Cobertura', 'Positivos', 'Negativos', 'Indecisos', 'No Trab.', 'AR', 'Estrellas']);
            this.tableKeys.set(['totalManzanas', 'totalPredios', 'totalVisitas', 'porcentajeCobertura', 'positivos', 'negativos', 'indecisos', 'noTrabajables', 'apoyosAlcalde', 'estrellas']);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'productividad':
        this.reporteService.productividad(fi, ff).subscribe({
          next: (r) => {
            this.reportData.set(r.datos || []);
            this.tableColumns.set(['Grupo', 'Total', 'Positivos', 'Negativos', 'Indecisos', 'En Blanco', 'No Trab.', 'AR', 'Estrellas']);
            this.tableKeys.set(['grupo', 'total', 'positivos', 'negativos', 'indecisos', 'enBlanco', 'noTrabajables', 'apoyosAlcalde', 'estrellas']);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      default:
        this.loading.set(false);
    }
  }

  private loadDataMapa(r: any) {
    this.reportData.set(r.datos || []);
    this.tableColumns.set(['Clave Catastral', 'Propietario', 'Dirección', 'Estado', 'Fecha']);
    this.tableKeys.set(['claveCatastral', 'propietario', 'direccion', 'estadoVisita', 'fechaCreacion']);
    this.loading.set(false);
  }

  exportarExcel() {
    const key = this.selectedReport();
    if (!key) return;
    const fi = this.fechaInicio + 'T00:00:00';
    const ff = this.fechaFin + 'T23:59:59';
    switch (key) {
      case 'visitas-usuario': this.reporteService.descargarExcel('visitantes/exportar/excel', { fechaInicio: fi, fechaFin: ff }); break;
      case 'visitas-sector': this.reporteService.descargarExcel('visitantes/exportar/excel', { fechaInicio: fi, fechaFin: ff }); break;
      case 'predios-pendientes': this.reporteService.descargarExcel('predios/exportar/excel', {}); break;
      case 'cobertura': this.reporteService.descargarExcel('predios/exportar/excel', {}); break;
      case 'productividad': this.reporteService.descargarExcel('visitantes/exportar/excel', { fechaInicio: fi, fechaFin: ff }); break;
      default: break;
    }
  }

  exportarPDF() {
    const key = this.selectedReport();
    if (!key) return;
    const fi = this.fechaInicio + 'T00:00:00';
    const ff = this.fechaFin + 'T23:59:59';
    switch (key) {
      case 'visitas-usuario': this.reporteService.descargarPDF('visitantes/exportar/pdf', { fechaInicio: fi, fechaFin: ff }); break;
      case 'visitas-sector': this.reporteService.descargarPDF('visitantes/exportar/pdf', { fechaInicio: fi, fechaFin: ff }); break;
      case 'predios-pendientes': this.reporteService.descargarPDF('predios/exportar/pdf', {}); break;
      case 'cobertura': this.reporteService.descargarPDF('predios/exportar/pdf', {}); break;
      case 'productividad': this.reporteService.descargarPDF('visitantes/exportar/pdf', { fechaInicio: fi, fechaFin: ff }); break;
      default: break;
    }
  }
}
