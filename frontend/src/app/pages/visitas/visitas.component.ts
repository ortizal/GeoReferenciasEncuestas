import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitaService } from '../../core/services/visita.service';
import { WebSocketService, ImportProgress } from '../../core/services/websocket.service';
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
          <div class="dropdown">
            <button class="btn-actions" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-gear-wide-connected"></i> Acciones <i class="bi bi-chevron-down"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-end">
              <button class="dropdown-item" (click)="descargarPlantilla()"><i class="bi bi-download"></i> Descargar Plantilla</button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="abrirImportar()"><i class="bi bi-upload"></i> Importar Excel</button>
              <button class="dropdown-item" (click)="exportarExcel()"><i class="bi bi-file-earmark-excel"></i> Exportar Excel</button>
              <button class="dropdown-item" (click)="exportarPDF()"><i class="bi bi-file-earmark-pdf"></i> Exportar PDF</button>
          </div>
        </div>
        <!-- Pagination -->
        <div class="pagination-bar" *ngIf="totalPages() > 1">
          <span class="pagination-info">Mostrando {{ currentPage() * pageSize() + 1 }}–{{ Math.min((currentPage() + 1) * pageSize(), totalElements()) }} de {{ totalElements() }}</span>
          <div class="pagination-controls">
            <button class="page-btn" (click)="goToPage(0)" [disabled]="currentPage() === 0"><i class="bi bi-chevron-double-left"></i></button>
            <button class="page-btn" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0"><i class="bi bi-chevron-left"></i></button>
            <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <button class="page-btn" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"><i class="bi bi-chevron-right"></i></button>
            <button class="page-btn" (click)="goToPage(totalPages() - 1)" [disabled]="currentPage() >= totalPages() - 1"><i class="bi bi-chevron-double-right"></i></button>
          </div>
        </div>
      </div>
      </div>
      <div class="card-premium">
        <div class="filter-bar">
          <select class="filter-select" [(ngModel)]="filtroEstado" (change)="buscar()"><option value="">Todos los estados</option><option value="POSITIVO">Positivo</option><option value="NEGATIVO">Negativo</option><option value="INDECISO">Indeciso</option><option value="PENDIENTE">Pendiente</option><option value="NO_TRABAJABLE">No Trabajable</option><option value="EN_BLANCO">En Blanco</option></select>
          <div class="date-filter"><label>Desde:</label><input type="date" [(ngModel)]="fechaDesde" (change)="buscar()" autocomplete="off"></div>
          <div class="date-filter"><label>Hasta:</label><input type="date" [(ngModel)]="fechaHasta" (change)="buscar()" autocomplete="off"></div>
          <div class="search-box"><i class="bi bi-search"></i><input type="text" placeholder="Buscar..." [(ngModel)]="busqueda" (keyup.enter)="buscar()" autocomplete="off"></div>
        </div>
        <div class="card-premium-body no-padding">
          <div class="table-responsive">
            <table class="table-premium">
              <thead><tr>
                <th class="sortable" (click)="toggleSort('predio.claveCatastral')">Predio <i class="bi" [ngClass]="sortIcon('predio.claveCatastral')"></i></th>
                <th class="sortable" (click)="toggleSort('propietarioPredio')">Propietario <i class="bi" [ngClass]="sortIcon('propietarioPredio')"></i></th>
                <th class="sortable" (click)="toggleSort('estadoVisita')">Estado <i class="bi" [ngClass]="sortIcon('estadoVisita')"></i></th>
                <th class="sortable" (click)="toggleSort('nombreBrigada')">Brigada <i class="bi" [ngClass]="sortIcon('nombreBrigada')"></i></th>
                <th class="sortable" (click)="toggleSort('grupoBrigada')">Grupo <i class="bi" [ngClass]="sortIcon('grupoBrigada')"></i></th>
                <th class="sortable" (click)="toggleSort('parroquia')">Parroquia <i class="bi" [ngClass]="sortIcon('parroquia')"></i></th>
                <th class="sortable" (click)="toggleSort('barrio')">Barrio <i class="bi" [ngClass]="sortIcon('barrio')"></i></th>
                <th>AR</th><th>Estrella</th>
                <th class="sortable" (click)="toggleSort('fechaVisita')">Fecha <i class="bi" [ngClass]="sortIcon('fechaVisita')"></i></th>
                <th></th>
              </tr></thead>
              <tbody>
                <tr *ngFor="let v of visitas()">
                  <td><code class="cell-code">{{ v.claveCatastralPredio }}</code></td>
                  <td><span class="cell-primary">{{ v.propietarioPredio }}</span></td>
                  <td><span class="badge-premium" [ngClass]="getEstadoBadge(v.estadoVisita)">{{ v.estadoVisita }}</span></td>
                  <td>{{ v.nombreBrigada || '—' }}</td>
                  <td>{{ v.grupoBrigada || '—' }}</td>
                  <td>{{ v.parroquia || '—' }}</td>
                  <td>{{ v.barrio || '—' }}</td>
                  <td><i class="bi" [ngClass]="v.apoyaAlcalde ? 'bi-check-circle-fill text-success' : 'bi-x-circle'"></i></td>
                  <td><i class="bi" [ngClass]="v.estrella ? 'bi-star-fill text-warning' : 'bi-star'"></i></td>
                  <td>{{ v.fechaVisita | date:'dd/MM/yy' }}</td>
                  <td><button class="action-btn" (click)="verDetalles(v)"><i class="bi bi-eye"></i></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Detalles -->
      <div class="modal-overlay" *ngIf="showDetalles()" (click)="cerrarDetalles()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h4>Detalles de Visita</h4><button class="modal-close" (click)="cerrarDetalles()"><i class="bi bi-x"></i></button></div>
          <div class="modal-body" *ngIf="visitaSeleccionada">
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Predio</span><span class="detail-value">{{ visitaSeleccionada.claveCatastralPredio }}</span></div>
              <div class="detail-item"><span class="detail-label">Propietario</span><span class="detail-value">{{ visitaSeleccionada.propietarioPredio }}</span></div>
              <div class="detail-item"><span class="detail-label">Estado</span><span class="badge-premium" [ngClass]="getEstadoBadge(visitaSeleccionada.estadoVisita)">{{ visitaSeleccionada.estadoVisita }}</span></div>
              <div class="detail-item"><span class="detail-label">Nombre Brigada</span><span class="detail-value">{{ visitaSeleccionada.nombreBrigada || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Grupo</span><span class="detail-value">{{ visitaSeleccionada.grupoBrigada || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Parroquia</span><span class="detail-value">{{ visitaSeleccionada.parroquia || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Barrio</span><span class="detail-value">{{ visitaSeleccionada.barrio || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Apoya Alcalde</span><span class="detail-value">{{ visitaSeleccionada.apoyaAlcalde ? 'Sí' : 'No' }}</span></div>
              <div class="detail-item"><span class="detail-label">Estrella</span><span class="detail-value">{{ visitaSeleccionada.estrella ? 'Sí' : 'No' }}</span></div>
              <div class="detail-item"><span class="detail-label">N° Casas</span><span class="detail-value">{{ visitaSeleccionada.numCasasBrigada || '—' }}</span></div>
              <div class="detail-item full"><span class="detail-label">Observaciones</span><span class="detail-value">{{ visitaSeleccionada.observaciones || 'Sin observaciones' }}</span></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" (click)="cerrarDetalles()">Cerrar</button></div>
        </div>
      </div>

      <!-- Modal Importar Visitas - Paso 1: Seleccionar archivo -->
      <div class="modal-overlay" *ngIf="showImportar() && !showPreview()" (click)="cerrarImportar()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h4>Importar Visitas</h4><button class="modal-close" (click)="cerrarImportar()"><i class="bi bi-x"></i></button></div>
          <div class="modal-body">
            <p class="import-desc">Seleccione el archivo Excel (.xls) con las columnas: clave_cata, BRIGADA1, AR, ESTRELLA, etc.</p>
            <div class="upload-zone" (click)="fileInput.click()" [class.has-file]="archivoSeleccionado()">
              <input #fileInput type="file" accept=".xls,.xlsx" (change)="onFileSelected($event)" hidden>
              <i class="bi" [ngClass]="archivoSeleccionado() ? 'bi-file-earmark-check' : 'bi-cloud-arrow-up'"></i>
              <span>{{ archivoSeleccionado() ? archivoNombre() : 'Click para seleccionar archivo' }}</span>
            </div>
            <div class="import-progress" *ngIf="cargando()">
              <div class="progress-bar"><div class="progress-fill"></div></div>
              <span>Leyendo archivo...</span>
            </div>
            <div class="import-result error" *ngIf="resultadoImportacion() && resultadoImportacion()!.includes('Error')">
              <i class="bi bi-exclamation-circle-fill"></i> {{ resultadoImportacion() }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarImportar()">Cancelar</button>
            <button class="btn-save" (click)="cargarPreview()" [disabled]="!archivoSeleccionado() || cargando()">
              {{ cargando() ? 'Cargando...' : 'Vista Previa' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Importar Visitas - Paso 2: Vista previa -->
      <div class="modal-overlay" *ngIf="showPreview()" (click)="onPreviewOverlayClick($event)">
        <div class="modal-card modal-xl" (click)="$event.stopPropagation()">
          <div class="modal-header modal-header-import">
            <div class="modal-header-left">
              <h4>Vista Previa — {{ previewData().length }} registros</h4>
              <button class="modal-close" (click)="cerrarPreview()" [disabled]="importando()"><i class="bi bi-x"></i></button>
            </div>
            <div class="import-progress-bar" *ngIf="importando()">
              <div class="progress-info">
                <span class="progress-text">Importando {{ importProgress().current }} de {{ importProgress().total }}...</span>
                <span class="progress-counts">
                  <span class="count-ok"><i class="bi bi-check-circle-fill"></i> {{ importProgress().imported }}</span>
                  <span class="count-auto" *ngIf="importProgress().autoCreated > 0"><i class="bi bi-plus-circle-fill"></i> {{ importProgress().autoCreated }} nuevos</span>
                  <span class="count-dup" *ngIf="importProgress().duplicated > 0"><i class="bi bi-copy"></i> {{ importProgress().duplicated }}</span>
                  <span class="count-err" *ngIf="importProgress().errors > 0"><i class="bi bi-x-circle-fill"></i> {{ importProgress().errors }}</span>
                </span>
              </div>
              <div class="progress-track">
                <div class="progress-fill-bar" [style.width.%]="importProgressPercent()"></div>
              </div>
            </div>
          </div>
          <div class="modal-body modal-body-table">
            <div class="preview-stats">
              <span class="stat"><i class="bi bi-check-circle-fill text-success"></i> {{ countByEstado('POSITIVO') }} Positivos</span>
              <span class="stat"><i class="bi bi-x-circle-fill text-danger"></i> {{ countByEstado('NEGATIVO') }} Negativos</span>
              <span class="stat"><i class="bi bi-question-circle-fill text-warning"></i> {{ countByEstado('INDECISO') }} Indecisos</span>
              <span class="stat"><i class="bi bi-clock-fill text-info"></i> {{ countByEstado('PENDIENTE') }} Pendientes</span>
              <span class="stat"><i class="bi bi-eye-slash"></i> {{ countByEstado('EN_BLANCO') }} En Blanco</span>
            </div>
            <div class="preview-no-encontrados" *ngIf="countNoEncontrados() > 0 && !importando()">
              <i class="bi bi-info-circle text-info"></i> {{ countNoEncontrados() }} predios no encontrados — se crearán automáticamente
              <button class="btn-download-report" (click)="descargarReporteNoEncontrados()"><i class="bi bi-download"></i> Descargar Reporte</button>
            </div>
            <div class="table-responsive">
              <table class="table-premium table-preview">
                <thead><tr>
                  <th *ngIf="importando()" class="col-status">Estado</th>
                  <th>Clave</th><th>Propietario</th><th>Estado</th><th>Brigada</th><th>Grupo</th><th>Parroquia</th><th>Barrio</th><th>AR</th><th>Estrella</th>
                </tr></thead>
                <tbody>
                  <tr *ngFor="let v of previewData().slice(0, previewLimit())"
                      [class.row-not-found]="!v.idPredio"
                      [class.row-imported]="getRowStatus(v.claveCatastralPredio) === 'IMPORTED'"
                      [class.row-auto-created]="getRowStatus(v.claveCatastralPredio) === 'AUTO_CREATED'"
                      [class.row-duplicate]="getRowStatus(v.claveCatastralPredio) === 'DUPLICATE'"
                      [class.row-error-status]="getRowStatus(v.claveCatastralPredio) === 'ERROR'"
                      [class.row-notfound-status]="getRowStatus(v.claveCatastralPredio) === 'NOT_FOUND'">
                    <td *ngIf="importando()" class="col-status">
                      <i class="bi row-icon" *ngIf="getRowStatus(v.claveCatastralPredio)"
                      [ngClass]="{
                            'bi-check-circle-fill text-success': getRowStatus(v.claveCatastralPredio) === 'IMPORTED',
                            'bi-plus-circle-fill text-info': getRowStatus(v.claveCatastralPredio) === 'AUTO_CREATED',
                            'bi-copy text-warning': getRowStatus(v.claveCatastralPredio) === 'DUPLICATE',
                            'bi-x-circle-fill text-danger': getRowStatus(v.claveCatastralPredio) === 'ERROR',
                            'bi-question-circle-fill text-muted': getRowStatus(v.claveCatastralPredio) === 'NOT_FOUND'
                          }"></i>
                      <i class="bi bi-hourglass-split text-muted" *ngIf="!getRowStatus(v.claveCatastralPredio) && getRowIndex(v) < importProgress().current"></i>
                    </td>
                    <td><code class="cell-code">{{ v.claveCatastralPredio }}</code></td>
                    <td><span class="cell-primary">{{ v.propietarioPredio }}</span></td>
                    <td><span class="badge-premium" [ngClass]="getEstadoBadge(v.estadoVisita)">{{ v.estadoVisita }}</span></td>
                    <td>{{ v.nombreBrigada || '—' }}</td>
                    <td>{{ v.grupoBrigada || '—' }}</td>
                    <td>{{ v.parroquia || '—' }}</td>
                    <td>{{ v.barrio || '—' }}</td>
                    <td><i class="bi" [ngClass]="v.apoyaAlcalde ? 'bi-check-circle-fill text-success' : 'bi-x-circle'"></i></td>
                    <td><i class="bi" [ngClass]="v.estrella ? 'bi-star-fill text-warning' : 'bi-star'"></i></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button class="btn-load-more" *ngIf="previewData().length > previewLimit()" (click)="previewLimit.set(previewLimit() + 100)">
              Mostrar más ({{ previewData().length - previewLimit() }} restantes)
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarPreview()" [disabled]="importando()">{{ importando() ? 'Importando...' : 'Cancelar' }}</button>
            <button class="btn-save btn-confirm" *ngIf="!importando()" (click)="confirmarImportacion()" [disabled]="guardando()">
              <i class="bi bi-check-lg"></i> Confirmar Importación ({{ previewData().length }})
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Exito -->
      <div class="modal-overlay" *ngIf="showExito()" (click)="cerrarExito()">
        <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-body" style="text-align:center; padding: var(--space-8);">
            <i class="bi bi-check-circle-fill" style="font-size: 3rem; color: var(--success-500);"></i>
            <h4 style="margin: var(--space-4) 0 var(--space-2);">{{ exitoMensaje() }}</h4>
            <p style="color: var(--text-secondary); font-size: var(--text-sm);" *ngIf="exitoDetalle()">{{ exitoDetalle() }}</p>
            <button class="btn-download-report-sm" *ngIf="lastImportNotFoundCount() > 0" (click)="descargarReporteNoEncontradosLast()">
              <i class="bi bi-download"></i> Descargar Reporte de Excepciones ({{ lastImportNotFoundCount() }})
            </button>
          </div>
          <div class="modal-footer" style="justify-content: center;">
            <button class="btn-save" (click)="cerrarExito(); buscar()">Aceptar</button>
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
    .header-actions { display: flex; gap: var(--space-2); }
    .btn-actions { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
    .btn-actions:hover { background: var(--primary-700); }
    .btn-actions i.bi-chevron-down { font-size: 10px; }
    .dropdown-menu {
      --bs-dropdown-min-width: 220px;
      --bs-dropdown-padding-y: 0.25rem;
      --bs-dropdown-bg: var(--bg-surface);
      --bs-dropdown-border-color: var(--border-default);
      --bs-dropdown-border-radius: var(--radius-lg);
      --bs-dropdown-box-shadow: var(--shadow-lg);
      --bs-dropdown-link-color: var(--text-primary);
      --bs-dropdown-link-hover-color: var(--text-primary);
      --bs-dropdown-link-hover-bg: var(--bg-hover);
      --bs-dropdown-link-active-color: #fff;
      --bs-dropdown-link-active-bg: var(--primary-600);
      --bs-dropdown-divider-bg: var(--border-light);
      --bs-dropdown-divider-margin-y: 0.25rem;
      --bs-dropdown-item-padding-y: var(--space-2);
      --bs-dropdown-item-padding-x: var(--space-4);
    }
    .dropdown-menu.show { animation: fadeInUp 0.15s ease-out; }
    .dropdown-item { display: flex; align-items: center; gap: var(--space-2); }
    .dropdown-item i { width: 16px; text-align: center; color: var(--text-secondary); }
    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .filter-bar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); flex-wrap: wrap; }
    .date-filter { display: flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--text-secondary); }
    .date-filter input[type="date"] { height: 36px; padding: 0 var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-xs); background: var(--bg-surface); color: var(--text-primary); }
    .sortable { cursor: pointer; user-select: none; &:hover { color: var(--primary-600); } i { font-size: 0.625rem; margin-left: 2px; } }
    .pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border-light); }
    .pagination-info { font-size: var(--text-xs); color: var(--text-secondary); }
    .pagination-controls { display: flex; align-items: center; gap: var(--space-2); }
    .page-btn { width: 32px; height: 32px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); &:hover:not(:disabled) { background: var(--bg-hover); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
    .page-info { font-size: var(--text-xs); color: var(--text-secondary); padding: 0 var(--space-2); }
    .search-box { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); background: var(--neutral-50); border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; min-width: 240px; &:focus-within { border-color: var(--border-focus); background: var(--bg-surface); } i { color: var(--text-tertiary); } input { flex: 1; border: none; background: transparent; font-size: var(--text-sm); outline: none; color: var(--text-primary); &::placeholder { color: var(--text-tertiary); } } }
    .filter-select { height: 36px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; }
    .card-premium-body { padding: 0; }
    .no-padding { padding: 0 !important; }
    .table-responsive { overflow-x: auto; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 2px solid var(--border-default); white-space: nowrap; } tbody tr { transition: background var(--transition-fast); &:nth-child(even) { background: var(--neutral-25); } &:nth-child(odd) { background: var(--neutral-0); } &:hover { background: var(--bg-hover) !important; } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } } tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; } }
    .cell-code { font-size: var(--text-xs); background: var(--neutral-100); padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-family: var(--font-mono); }
    .cell-primary { font-weight: 500; }
    .action-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 500px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-header-import { flex-direction: column; align-items: stretch; padding: 0; }
    .modal-header-left { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-6); }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); } }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; &.full { grid-column: span 2; } }
    .detail-label { font-size: var(--text-xs); color: var(--text-secondary); font-weight: 500; }
    .detail-value { font-size: var(--text-sm); color: var(--text-primary); }
    .import-desc { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4); }
    .upload-zone { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-8) var(--space-4); border: 2px dashed var(--border-default); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-fast); color: var(--text-tertiary); }
    .upload-zone:hover { border-color: var(--primary-400); background: var(--primary-50); }
    .upload-zone.has-file { border-color: var(--success-500); background: var(--success-50); color: var(--success-600); }
    .upload-zone i { font-size: 2rem; }
    .upload-zone span { font-size: var(--text-sm); }
    .import-progress { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); }
    .progress-bar { flex: 1; height: 6px; background: var(--neutral-200); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--primary-600); border-radius: 3px; animation: progressIndeterminate 1.5s ease-in-out infinite; }
    .import-result { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-4); padding: var(--space-3); background: var(--success-50); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--success-600); }
    .btn-save { padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover:not(:disabled) { background: var(--primary-700); } &:disabled { opacity: 0.6; } }
    .btn-confirm { background: var(--success-600); &:hover:not(:disabled) { background: #15803d; } }
    .modal-xl { max-width: 950px; }
    .modal-body-table { max-height: 70vh; overflow-y: auto; padding: 0 !important; }
    .table-preview { margin: 0; }
    .table-preview thead th { position: sticky; top: 0; z-index: 1; }
    .col-status { width: 40px; text-align: center; }
    .row-icon { font-size: 1rem; }
    .row-imported { background: rgba(34,197,94,0.08) !important; }
    .row-duplicate { background: rgba(245,158,11,0.08) !important; }
    .row-error-status { background: rgba(239,68,68,0.08) !important; }
    .row-notfound-status { background: rgba(156,163,175,0.08) !important; }
    .row-auto-created { background: rgba(59,130,246,0.08) !important; }
    .row-not-found { opacity: 0.7; }
    .preview-stats { display: flex; gap: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--neutral-50); border-bottom: 1px solid var(--border-light); flex-wrap: wrap; }
    .preview-stats .stat { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); }
    .preview-no-encontrados { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: rgba(59,130,246,0.1); color: #2563eb; font-size: var(--text-xs); font-weight: 500; }
    .btn-download-report { margin-left: auto; padding: var(--space-1) var(--space-3); border: 1px solid #2563eb; border-radius: var(--radius-md); background: transparent; color: #2563eb; font-size: var(--text-xs); font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: var(--space-1); transition: all var(--transition-fast); &:hover { background: #2563eb; color: #fff; } }
    .btn-load-more { display: block; width: 100%; padding: var(--space-3); border: none; background: var(--neutral-50); color: var(--primary-600); font-size: var(--text-sm); font-weight: 500; cursor: pointer; text-align: center; &:hover { background: var(--neutral-100); } }
    .import-result.error { background: var(--danger-50); color: var(--danger-600); }
    .import-result.error i { color: var(--danger-600); }
    .import-progress-bar { padding: var(--space-3) var(--space-6); background: var(--primary-50); border-bottom: 1px solid var(--primary-200); }
    .progress-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .progress-text { font-size: var(--text-sm); font-weight: 600; color: var(--primary-700); }
    .progress-counts { display: flex; gap: var(--space-3); font-size: var(--text-xs); font-weight: 500; }
    .count-ok { color: #16a34a; display: flex; align-items: center; gap: 2px; }
    .count-auto { color: #3b82f6; display: flex; align-items: center; gap: 2px; }
    .count-dup { color: #d97706; display: flex; align-items: center; gap: 2px; }
    .count-err { color: #dc2626; display: flex; align-items: center; gap: 2px; }
    .progress-track { height: 6px; background: var(--primary-200); border-radius: 3px; overflow: hidden; }
    .progress-fill-bar { height: 100%; background: var(--primary-600); border-radius: 3px; transition: width 0.15s ease-out; }
    .btn-download-report-sm { display: inline-flex; align-items: center; gap: var(--space-2); margin-top: var(--space-4); padding: var(--space-2) var(--space-4); border: 1px solid var(--primary-600); border-radius: var(--radius-md); background: transparent; color: var(--primary-600); font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: all var(--transition-fast); &:hover { background: var(--primary-600); color: #fff; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes progressIndeterminate { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
  `]
})
export class VisitasComponent implements OnInit, OnDestroy {
  visitas = signal<Visita[]>([]); showDetalles = signal(false); busqueda = ''; filtroEstado = ''; visitaSeleccionada: Visita | null = null;
  showImportar = signal(false); showPreview = signal(false); showExito = signal(false); cargando = signal(false); guardando = signal(false);
  archivoSeleccionado = signal(false); archivoNombre = signal(''); resultadoImportacion = signal(''); exitoMensaje = signal(''); exitoDetalle = signal('');
  archivoFile: File | null = null;
  previewData = signal<Visita[]>([]); previewLimit = signal(50);
  importando = signal(false);
  importProgress = signal<ImportProgress>({ sessionId: '', current: 0, total: 0, rowKey: '', rowStatus: '', imported: 0, updated: 0, duplicated: 0, errors: 0, notFound: 0, autoCreated: 0, completed: false });
  rowStatusMap = signal<Map<string, string>>(new Map());
  importProgressPercent = signal(0);
  lastImportNotFoundCount = signal(0);
  lastImportNotFoundData = signal<Visita[]>([]);

  fechaDesde = '';
  fechaHasta = '';
  currentPage = signal(0);
  pageSize = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);
  sortField = signal('fechaVisita');
  sortDir = signal<'asc'|'desc'>('desc');
  Math = Math;

  private unsubscribeProgress: (() => void) | null = null;

  constructor(private visitaService: VisitaService, private wsService: WebSocketService) {}
  ngOnInit() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaDesde = this.formatDate(primerDiaMes);
    this.fechaHasta = this.formatDate(hoy);
    this.buscar();
  }

  private formatDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  ngOnDestroy() {
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = null;
    }
  }

  buscar() {
    this.visitaService.buscar(
      this.busqueda, this.currentPage(), this.pageSize(), this.filtroEstado,
      this.fechaDesde, this.fechaHasta, this.sortField(), this.sortDir()
    ).subscribe({
      next: (r) => {
        if (r.exitoso && r.datos) {
          this.visitas.set(r.datos.content || []);
          this.totalElements.set(r.datos.totalElements || 0);
          this.totalPages.set(r.datos.totalPages || 0);
        }
      }
    });
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage.set(0);
    this.buscar();
  }

  sortIcon(field: string): string {
    if (this.sortField() !== field) return 'bi-arrow-down-up';
    return this.sortDir() === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.buscar();
  }
  verDetalles(v: Visita) { this.visitaSeleccionada = v; this.showDetalles.set(true); }
  cerrarDetalles() { this.showDetalles.set(false); this.visitaSeleccionada = null; }
  getEstadoBadge(estado?: string): string { switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; case 'PENDIENTE': return 'badge-info'; default: return 'badge-neutral'; } }

  countByEstado(estado: string): number { return this.previewData().filter(v => v.estadoVisita === estado).length; }
  countNoEncontrados(): number { return this.previewData().filter(v => !v.idPredio).length; }
  countValidos(): number { return this.previewData().filter(v => v.idPredio).length; }

  getRowStatus(clave: string | undefined): string | undefined {
    if (!clave) return undefined;
    return this.rowStatusMap().get(clave);
  }

  getRowIndex(v: Visita): number {
    return this.previewData().findIndex(item => item.claveCatastralPredio === v.claveCatastralPredio);
  }

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.showImportar.set(true); this.showPreview.set(false); }
  cerrarImportar() { this.showImportar.set(false); this.showPreview.set(false); this.previewData.set([]); this.resetImportState(); }
  cerrarPreview() { if (this.importando()) return; this.showPreview.set(false); this.previewData.set([]); this.resetImportState(); }
  cerrarExito() { this.showExito.set(false); this.exitoDetalle.set(''); this.lastImportNotFoundCount.set(0); this.lastImportNotFoundData.set([]); }
  onFileSelected(event: Event) { const input = event.target as HTMLInputElement; if (input.files && input.files.length > 0) { this.archivoFile = input.files[0]; this.archivoNombre.set(input.files[0].name); this.archivoSeleccionado.set(true); } }

  onPreviewOverlayClick(event: Event) {
    if (!this.importando()) this.cerrarImportar();
  }

  private resetImportState() {
    this.importando.set(false);
    this.rowStatusMap.set(new Map());
    this.importProgress.set({ sessionId: '', current: 0, total: 0, rowKey: '', rowStatus: '', imported: 0, updated: 0, duplicated: 0, errors: 0, notFound: 0, autoCreated: 0, completed: false });
    this.importProgressPercent.set(0);
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = null;
    }
  }

  cargarPreview() {
    if (!this.archivoFile) return;
    this.cargando.set(true);
    this.resultadoImportacion.set('');
    this.visitaService.previsualizarImportacion(this.archivoFile).subscribe({
      next: (r) => {
        this.cargando.set(false);
        if (r.exitoso && r.datos) {
          this.previewData.set(r.datos);
          this.previewLimit.set(50);
          this.showPreview.set(true);
        } else {
          this.resultadoImportacion.set(r.mensaje || 'Error al leer el archivo');
        }
      },
      error: () => { this.cargando.set(false); this.resultadoImportacion.set('Error al conectar con el servidor'); }
    });
  }

  confirmarImportacion() {
    const todos = this.previewData();
    if (todos.length === 0) return;
    this.guardando.set(true);
    this.importando.set(true);
    this.rowStatusMap.set(new Map());
    this.importProgressPercent.set(0);

    const sessionId = 'visitas-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    this.unsubscribeProgress = this.wsService.subscribeToImportProgress(sessionId, (msg) => {
      this.importProgress.set(msg);
      if (msg.total > 0) {
        this.importProgressPercent.set(Math.round((msg.current / msg.total) * 100));
      }
      if (msg.rowKey && msg.rowStatus && msg.rowStatus !== 'COMPLETED') {
        this.rowStatusMap.update(map => {
          const newMap = new Map(map);
          newMap.set(msg.rowKey, msg.rowStatus);
          return newMap;
        });
      }
      if (msg.completed) {
        this.importando.set(false);
        this.guardando.set(false);
        const notFoundData = this.previewData().filter(v => !v.idPredio);
        this.lastImportNotFoundCount.set(msg.notFound);
        this.lastImportNotFoundData.set(notFoundData);
        this.showPreview.set(false);
        this.showImportar.set(false);
        this.previewData.set([]);
        this.exitoMensaje.set(`${msg.imported} visitas importadas`);
        let detalle = 'La importación se completó exitosamente.';
        if (msg.autoCreated > 0) detalle += ` ${msg.autoCreated} predios creados automáticamente.`;
        if (msg.duplicated > 0) detalle += ` ${msg.duplicated} duplicadas omitidas.`;
        if (msg.notFound > 0) detalle += ` ${msg.notFound} no pudieron crearse.`;
        this.exitoDetalle.set(detalle);
        this.showExito.set(true);
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      }
    });

    this.visitaService.confirmarImportacion(todos, sessionId).subscribe({
      next: (r) => {
        if (!r.exitoso) {
          this.guardando.set(false);
          this.importando.set(false);
          this.resultadoImportacion.set(r.mensaje || 'Error al importar');
          if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
        }
      },
      error: () => {
        this.guardando.set(false);
        this.importando.set(false);
        this.resultadoImportacion.set('Error al conectar con el servidor');
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      }
    });
  }

  descargarReporteNoEncontrados() {
    const noEncontrados = this.previewData().filter(v => !v.idPredio);
    if (noEncontrados.length === 0) return;
    this.visitaService.descargarReporteNoEncontrados(noEncontrados).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'predios_no_encontrados.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al descargar reporte')
    });
  }

  descargarReporteNoEncontradosLast() {
    const data = this.lastImportNotFoundData();
    if (data.length === 0) return;
    this.visitaService.descargarReporteNoEncontrados(data).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'predios_no_encontrados.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al descargar reporte')
    });
  }

  descargarPlantilla() {
    const link = document.createElement('a');
    link.href = 'assets/docs/plantilla_importar_visitas.xlsx';
    link.download = 'plantilla_importar_visitas.xlsx';
    link.click();
  }

  exportarExcel() {
    this.visitaService.exportarExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'visitas_export.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al exportar')
    });
  }

  exportarPDF() {
    this.visitaService.exportarPDF().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'visitas_export.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al exportar')
    });
  }
}
