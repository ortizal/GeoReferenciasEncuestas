import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitaService } from '../../core/services/visita.service';
import { Visita } from '../../core/models/models';

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><h1 class="page-title">Visitas</h1><p class="page-subtitle">Historial de visitas de campo</p></div>
        <div class="header-actions">
          <button class="btn-export"><i class="bi bi-file-earmark-excel"></i> Excel</button>
          <button class="btn-export"><i class="bi bi-file-earmark-pdf"></i> PDF</button>
        </div>
      </div>
      <div class="card-premium">
        <div class="filter-bar">
          <select class="filter-select" [(ngModel)]="filtroEstado" (change)="buscar()"><option value="">Todos los estados</option><option value="POSITIVO">Positivo</option><option value="NEGATIVO">Negativo</option><option value="INDECISO">Indeciso</option><option value="PENDIENTE">Pendiente</option></select>
          <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Buscar..." [(ngModel)]="busqueda" (keyup.enter)="buscar()"></div>
        </div>
        <div class="card-premium-body no-padding">
          <div class="table-responsive">
            <table class="table-premium">
              <thead><tr><th>ID</th><th>Predio</th><th>Propietario</th><th>Visitador</th><th>Fecha</th><th>Estado</th><th>Obs.</th><th>Acciones</th></tr></thead>
              <tbody>
                <tr *ngFor="let v of visitas()">
                  <td>{{ v.idVisita }}</td>
                  <td><code class="cell-code">{{ v.claveCatastralPredio }}</code></td>
                  <td><span class="cell-primary">{{ v.propietarioPredio }}</span></td>
                  <td>{{ v.nombreVisitador }}</td>
                  <td>{{ v.fechaVisita | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><span class="badge-premium" [ngClass]="getEstadoBadge(v.estadoVisita)">{{ v.estadoVisita }}</span></td>
                  <td class="obs-cell">{{ v.observaciones | slice:0:40 }}</td>
                  <td><button class="action-btn" (click)="verDetalles(v)"><i class="bi bi-eye"></i></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-overlay" *ngIf="showDetalles()" (click)="cerrarDetalles()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h4>Detalles de Visita</h4><button class="modal-close" (click)="cerrarDetalles()"><i class="bi bi-x"></i></button></div>
          <div class="modal-body" *ngIf="visitaSeleccionada">
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Predio</span><span class="detail-value">{{ visitaSeleccionada?.claveCatastralPredio }}</span></div>
              <div class="detail-item"><span class="detail-label">Propietario</span><span class="detail-value">{{ visitaSeleccionada?.propietarioPredio }}</span></div>
              <div class="detail-item"><span class="detail-label">Visitador</span><span class="detail-value">{{ visitaSeleccionada?.nombreVisitador }}</span></div>
              <div class="detail-item"><span class="detail-label">Fecha</span><span class="detail-value">{{ visitaSeleccionada?.fechaVisita | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="detail-item full"><span class="detail-label">Estado</span><span class="badge-premium" [ngClass]="getEstadoBadge(visitaSeleccionada?.estadoVisita)">{{ visitaSeleccionada?.estadoVisita }}</span></div>
              <div class="detail-item full"><span class="detail-label">Observaciones</span><span class="detail-value">{{ visitaSeleccionada?.observaciones || 'Sin observaciones' }}</span></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" (click)="cerrarDetalles()">Cerrar</button></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
    .header-actions { display: flex; gap: var(--space-2); }
    .btn-export { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .filter-bar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .search-box { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); background: var(--neutral-50); border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; min-width: 240px; &:focus-within { border-color: var(--border-focus); background: var(--bg-surface); } i { color: var(--text-tertiary); } input { flex: 1; border: none; background: transparent; font-size: var(--text-sm); outline: none; color: var(--text-primary); &::placeholder { color: var(--text-tertiary); } } }
    .filter-select { height: 36px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; }
    .card-premium-body { padding: 0; }
    .no-padding { padding: 0 !important; }
    .table-responsive { overflow-x: auto; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; } tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } } tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; } }
    .cell-code { font-size: var(--text-xs); background: var(--neutral-100); padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-family: var(--font-mono); }
    .cell-primary { font-weight: 500; }
    .obs-cell { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); }
    .action-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 500px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); } }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; &.full { grid-column: span 2; } }
    .detail-label { font-size: var(--text-xs); color: var(--text-secondary); font-weight: 500; }
    .detail-value { font-size: var(--text-sm); color: var(--text-primary); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class VisitasComponent implements OnInit {
  visitas = signal<Visita[]>([]); showDetalles = signal(false); busqueda = ''; filtroEstado = ''; visitaSeleccionada: Visita | null = null;
  constructor(private visitaService: VisitaService) {}
  ngOnInit() { this.buscar(); }
  buscar() { this.visitaService.buscar(this.busqueda).subscribe({ next: (r) => { if (r.exitoso) this.visitas.set(r.datos?.content || []); } }); }
  verDetalles(v: Visita) { this.visitaSeleccionada = v; this.showDetalles.set(true); }
  cerrarDetalles() { this.showDetalles.set(false); this.visitaSeleccionada = null; }
  getEstadoBadge(estado?: string): string { switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; case 'PENDIENTE': return 'badge-info'; default: return 'badge-neutral'; } }
}
