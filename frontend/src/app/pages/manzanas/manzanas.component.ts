import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManzanaService } from '../../core/services/manzana.service';
import { Manzana } from '../../core/models/models';

@Component({
  selector: 'app-manzanas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><h1 class="page-title">Manzanas</h1><p class="page-subtitle">Gestión de manzanas catastrales</p></div>
        <div class="header-actions">
          <button class="btn-export"><i class="bi bi-file-earmark-excel"></i> Exportar</button>
          <button class="btn-primary-action" (click)="abrirFormulario()"><i class="bi bi-plus-lg"></i> Nueva Manzana</button>
        </div>
      </div>

      <div class="card-premium">
        <div class="filter-bar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Buscar manzana..." [(ngModel)]="busqueda" (keyup.enter)="buscar()">
          </div>
          <select class="filter-select" [(ngModel)]="filtroActivo" (change)="buscar()">
            <option [value]="true">Activos</option>
            <option [value]="false">Inactivos</option>
          </select>
        </div>

        <div class="card-premium-body no-padding">
          <div class="table-responsive">
            <table class="table-premium">
              <thead><tr><th>Clave</th><th>Nombre</th><th>Sector</th><th>Barrio</th><th>Predios</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                <tr *ngFor="let m of manzanas()">
                  <td><code class="cell-code">{{ m.claveCatastralManzana }}</code></td>
                  <td><span class="cell-primary">{{ m.nombre }}</span></td>
                  <td>{{ m.sector || '—' }}</td>
                  <td>{{ m.barrio || '—' }}</td>
                  <td><span class="badge-premium badge-info">{{ m.totalPredios || 0 }}</span></td>
                  <td><span class="badge-premium" [class.badge-success]="m.activo" [class.badge-neutral]="!m.activo">{{ m.activo ? 'Activo' : 'Inactivo' }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="action-btn" (click)="editar(m)" title="Editar"><i class="bi bi-pencil"></i></button>
                      <button class="action-btn danger" (click)="eliminar(m)" title="Eliminar"><i class="bi bi-trash3"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-footer">
          <span class="table-info">Mostrando {{ manzanas().length }} registros</span>
          <div class="pagination"><button class="page-btn" disabled>Anterior</button><button class="page-btn active">1</button><button class="page-btn">Siguiente</button></div>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showForm()" (click)="cerrarFormulario()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header"><h4>{{ editando() ? 'Editar' : 'Nueva' }} Manzana</h4><button class="modal-close" (click)="cerrarFormulario()"><i class="bi bi-x"></i></button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field"><label>Clave Catastral *</label><input class="form-input" [(ngModel)]="formData.claveCatastralManzana" placeholder="Ej: MZ-001"></div>
              <div class="form-field"><label>Nombre *</label><input class="form-input" [(ngModel)]="formData.nombre" placeholder="Nombre de la manzana"></div>
              <div class="form-field"><label>Sector</label><input class="form-input" [(ngModel)]="formData.sector" placeholder="Sector"></div>
              <div class="form-field"><label>Barrio</label><input class="form-input" [(ngModel)]="formData.barrio" placeholder="Barrio"></div>
              <div class="form-field full-width"><label>Polígono (GeoJSON)</label><textarea class="form-textarea" rows="4" [(ngModel)]="formData.poligonoGeoJSON" placeholder="Ingrese el GeoJSON del polígono"></textarea></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" (click)="cerrarFormulario()">Cancelar</button><button class="btn-save" (click)="guardar()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0; letter-spacing: -0.025em; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
    .header-actions { display: flex; gap: var(--space-2); }
    .btn-export { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-primary-action { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover { background: var(--primary-700); } }

    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .filter-bar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .search-box { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); background: var(--neutral-50); border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; min-width: 240px; &:focus-within { border-color: var(--border-focus); background: var(--bg-surface); } i { color: var(--text-tertiary); } input { flex: 1; border: none; background: transparent; font-size: var(--text-sm); outline: none; color: var(--text-primary); &::placeholder { color: var(--text-tertiary); } } }
    .filter-select { height: 36px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; }
    .card-premium-body { padding: 0; }
    .no-padding { padding: 0 !important; }
    .table-responsive { overflow-x: auto; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; } tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } } tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; } }
    .cell-code { font-size: var(--text-xs); background: var(--neutral-100); padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-family: var(--font-mono); }
    .cell-primary { font-weight: 500; color: var(--text-primary); }
    .row-actions { display: flex; gap: var(--space-1); }
    .action-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); color: var(--text-primary); } &.danger:hover { background: var(--danger-50); color: var(--danger-600); } }
    .table-footer { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border-light); }
    .table-info { font-size: var(--text-xs); color: var(--text-secondary); }
    .pagination { display: flex; gap: var(--space-1); }
    .page-btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-secondary); font-size: var(--text-xs); cursor: pointer; &:hover:not(:disabled) { background: var(--bg-hover); } &.active { background: var(--primary-600); color: #fff; border-color: var(--primary-600); } &:disabled { opacity: 0.5; } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 540px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-lg { max-width: 640px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); } }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-save { padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover:not(:disabled) { background: var(--primary-700); } &:disabled { opacity: 0.6; } }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); &.full-width { grid-column: span 2; } label { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); } }
    .form-input { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); } }
    .form-textarea { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; resize: vertical; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); } }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) { .page-header { flex-direction: column; gap: var(--space-4); } .form-grid { grid-template-columns: 1fr; .form-field.full-width { grid-column: span 1; } } }
  `]
})
export class ManzanasComponent implements OnInit {
  manzanas = signal<Manzana[]>([]);
  showForm = signal(false);
  editando = signal(false);
  saving = signal(false);
  busqueda = '';
  filtroActivo = true;
  formData: any = {};
  manzanaSeleccionada: Manzana | null = null;

  constructor(private manzanaService: ManzanaService) {}
  ngOnInit() { this.buscar(); }

  buscar() { this.manzanaService.buscar(this.busqueda, this.filtroActivo).subscribe({ next: (r) => { if (r.exitoso) this.manzanas.set(r.datos?.content || []); } }); }
  abrirFormulario(m?: Manzana) { if (m) { this.editando.set(true); this.manzanaSeleccionada = m; this.formData = { ...m }; } else { this.editando.set(false); this.manzanaSeleccionada = null; this.formData = {}; } this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; }
  editar(m: Manzana) { this.abrirFormulario(m); }
  guardar() { this.saving.set(true); const op = this.editando() ? this.manzanaService.actualizar(this.manzanaSeleccionada!.idManzana!, this.formData) : this.manzanaService.crear(this.formData); op.subscribe({ next: () => { this.saving.set(false); this.cerrarFormulario(); this.buscar(); }, error: () => { this.saving.set(false); } }); }
  eliminar(m: Manzana) { if (confirm(`¿Eliminar manzana ${m.nombre}?`)) this.manzanaService.eliminar(m.idManzana!).subscribe({ next: () => this.buscar() }); }
}
