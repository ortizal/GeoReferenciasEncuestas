import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header"><div><h1 class="page-title">Reportes</h1><p class="page-subtitle">Generación de reportes del sistema</p></div></div>

      <div class="reports-grid">
        <div class="report-card" *ngFor="let r of reports">
          <div class="report-icon" [style.background]="r.bg"><i class="bi" [ngClass]="r.icon"></i></div>
          <h4 class="report-title">{{ r.title }}</h4>
          <p class="report-desc">{{ r.desc }}</p>
        </div>
      </div>

      <div class="card-premium" style="margin-top:var(--space-6)">
        <div class="card-premium-header"><span class="card-premium-title">Filtros de Reporte</span></div>
        <div class="card-premium-body">
          <div class="filter-grid">
            <div class="form-field"><label>Fecha Inicio</label><input type="date" class="form-input" [(ngModel)]="fechaInicio"></div>
            <div class="form-field"><label>Fecha Fin</label><input type="date" class="form-input" [(ngModel)]="fechaFin"></div>
            <div class="form-field"><label>Sector</label><select class="form-input" [(ngModel)]="sector"><option value="">Todos</option><option>Norte</option><option>Sur</option><option>Este</option><option>Oeste</option></select></div>
            <div class="form-field" style="justify-content:flex-end"><button class="btn-primary-action"><i class="bi bi-file-earmark-bar-graph"></i> Generar</button></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
    .reports-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
    .report-card { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: var(--space-6); text-align: center; cursor: pointer; transition: all var(--transition-base); &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--primary-200); } }
    .report-icon { width: 52px; height: 52px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); i { font-size: 1.25rem; color: #fff; } }
    .report-title { font-size: var(--text-base); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-2); }
    .report-desc { font-size: var(--text-sm); color: var(--text-secondary); margin: 0; }
    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .card-premium-header { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .card-premium-title { font-size: var(--text-base); font-weight: var(--weight-semibold); }
    .card-premium-body { padding: var(--space-5); }
    .filter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); align-items: end; }
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: var(--text-sm); font-weight: 500; } }
    .form-input { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); } }
    .btn-primary-action { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; height: 40px; &:hover { background: var(--primary-700); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 768px) { .reports-grid { grid-template-columns: 1fr; } .filter-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class ReportesComponent {
  fechaInicio = ''; fechaFin = ''; sector = '';
  reports = [
    { title: 'Visitas por Usuario', desc: 'Reporte de visitas realizadas por cada visitador', icon: 'bi-person-check', bg: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' },
    { title: 'Visitas por Sector', desc: 'Distribución de visitas por sector geográfico', icon: 'bi-geo-alt', bg: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))' },
    { title: 'Predios Pendientes', desc: 'Lista de predios que aún no han sido visitados', icon: 'bi-hourglass-split', bg: 'linear-gradient(135deg, var(--warning-500), var(--warning-600))' },
    { title: 'Mapa Temático', desc: 'Mapa con colores según estado de visitas', icon: 'bi-map', bg: 'linear-gradient(135deg, var(--info-500), var(--info-600))' },
    { title: 'Cobertura', desc: 'Porcentaje de cobertura por manzana', icon: 'bi-pie-chart', bg: 'linear-gradient(135deg, var(--neutral-500), var(--neutral-700))' },
    { title: 'Productividad', desc: 'Indicadores de productividad por visitador', icon: 'bi-graph-up', bg: 'linear-gradient(135deg, var(--danger-500), var(--danger-700))' },
  ];
}
