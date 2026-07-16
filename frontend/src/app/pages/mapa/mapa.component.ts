import { Component, OnInit, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { ManzanaService } from '../../core/services/manzana.service';
import { PredioService } from '../../core/services/predio.service';
import { VisitaService } from '../../core/services/visita.service';
import { Manzana, Predio } from '../../core/models/models';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-page">
      <!-- Toolbar -->
      <div class="map-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Buscar predio o manzana..." [(ngModel)]="searchTerm" (keyup.enter)="buscarPredio()" autocomplete="off">
          </div>
        </div>
        <div class="toolbar-center">
          <button class="tool-btn" [class.active]="showManzanas" (click)="toggleLayer('manzanas')" title="Capa Manzanas">
            <i class="bi bi-grid-3x3"></i>
            <span>Manzanas</span>
          </button>
          <button class="tool-btn" [class.active]="showPredios" (click)="toggleLayer('predios')" title="Capa Predios">
            <i class="bi bi-house-door"></i>
            <span>Predios</span>
          </button>
          <div class="tool-divider"></div>
          <button class="tool-btn" [class.active]="showSpecialMarkers()" (click)="toggleSpecialMarkers()" title="Mostrar/Ocultar estrellas y apoyos">
            <i class="bi bi-star-fill" style="color:#F59E0B;font-size:0.875rem"></i>
            <i class="bi bi-person-check" style="color:#2563EB;font-size:0.875rem"></i>
            <span>Estrellas/AP</span>
          </button>
          <button class="tool-btn" (click)="clearSelection()" title="Limpiar selección">
            <i class="bi bi-x-circle"></i>
            <span>Limpiar</span>
          </button>
        </div>
        <div class="toolbar-right">
          <div class="legend">
            <button class="legend-item" [class.dimmed]="!isStatusVisible('POSITIVO')" (click)="toggleStatusFilter('POSITIVO')">
              <span class="legend-dot" style="background:#2563EB"></span>Positivo <span class="legend-count">{{ statusCounts()['POSITIVO'] || 0 }}</span>
            </button>
            <button class="legend-item" [class.dimmed]="!isStatusVisible('NEGATIVO')" (click)="toggleStatusFilter('NEGATIVO')">
              <span class="legend-dot" style="background:#DC2626"></span>Negativo <span class="legend-count">{{ statusCounts()['NEGATIVO'] || 0 }}</span>
            </button>
            <button class="legend-item" [class.dimmed]="!isStatusVisible('INDECISO')" (click)="toggleStatusFilter('INDECISO')">
              <span class="legend-dot" style="background:#F59E0B"></span>Indeciso <span class="legend-count">{{ statusCounts()['INDECISO'] || 0 }}</span>
            </button>
            <button class="legend-item" [class.dimmed]="!isStatusVisible('EN_BLANCO')" (click)="toggleStatusFilter('EN_BLANCO')">
              <span class="legend-dot" style="background:#6B7280"></span>Sin visita <span class="legend-count">{{ statusCounts()['EN_BLANCO'] || 0 }}</span>
            </button>
            <button class="legend-item" [class.dimmed]="!isStatusVisible('NO_TRABAJABLE')" (click)="toggleStatusFilter('NO_TRABAJABLE')">
              <span class="legend-dot" style="background:#1C1C1C"></span>No trabajable <span class="legend-count">{{ statusCounts()['NO_TRABAJABLE'] || 0 }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="map-wrapper">
        <div id="map" class="map-canvas"></div>
        <div class="map-stats">
          Manzanas: {{ manzanas().length }} | Predios: {{ predios().length }}
        </div>

        <!-- Info Panel -->
        <div class="info-panel" *ngIf="selectedManzana() || selectedPredio()" [class.slide-in]="true">
          <div class="panel-header">
            <h5 *ngIf="selectedManzana()">{{ selectedManzana()?.nombre }}</h5>
            <h5 *ngIf="selectedPredio()">{{ selectedPredio()?.claveCatastral }}</h5>
            <button class="panel-close" (click)="clearSelection()"><i class="bi bi-x"></i></button>
          </div>

          <!-- Manzana Info -->
          <div class="panel-body" *ngIf="selectedManzana()">
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Clave</span><span class="info-value">{{ selectedManzana()?.claveCatastralManzana }}</span></div>
              <div class="info-row"><span class="info-label">Sector</span><span class="info-value">{{ selectedManzana()?.sector || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Barrio</span><span class="info-value">{{ selectedManzana()?.barrio || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Total Predios</span><span class="info-value badge-premium badge-primary">{{ selectedManzana()?.totalPredios || 0 }}</span></div>
            </div>
            <button class="panel-action-btn" (click)="verPrediosManzana()">
              <i class="bi bi-list-ul"></i> Ver Predios
            </button>
          </div>

          <!-- Predio Info -->
          <div class="panel-body" *ngIf="selectedPredio()">
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Propietario</span><span class="info-value">{{ selectedPredio()?.propietario }}</span></div>
              <div class="info-row"><span class="info-label">Dirección</span><span class="info-value">{{ selectedPredio()?.direccion }}</span></div>
              <div class="info-row"><span class="info-label">Estado</span>
                <span class="badge-premium" [ngClass]="getEstadoBadge(selectedPredio()?.estadoVisita)">{{ selectedPredio()?.estadoVisita || 'En Blanco' }}</span>
              </div>
              <div class="info-row"><span class="info-label">Última Visita</span><span class="info-value">{{ selectedPredio()?.fechaUltimaVisita ? (selectedPredio()?.fechaUltimaVisita | date:'dd/MM/yyyy') : '—' }}</span></div>
            </div>
            <button class="panel-action-btn primary" (click)="registrarVisita()">
              <i class="bi bi-clipboard-plus"></i> Registrar Visita
            </button>
          </div>
        </div>
      </div>

      <!-- Visit Modal -->
      <div class="modal-overlay" *ngIf="showVisitaModal()" (click)="closeVisitaModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Registrar Visita</h4>
            <button class="modal-close" (click)="closeVisitaModal()"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="modal-field">
              <label>¿Es una vivienda trabajable?</label>
              <div class="radio-group">
                <label class="radio-option" [class.selected]="visitaForm.viviendaTrabajable">
                  <input type="radio" [value]="true" [(ngModel)]="visitaForm.viviendaTrabajable"> Sí
                </label>
                <label class="radio-option" [class.selected]="!visitaForm.viviendaTrabajable">
                  <input type="radio" [value]="false" [(ngModel)]="visitaForm.viviendaTrabajable"> No
                </label>
              </div>
            </div>
            <div class="modal-field">
              <label>Resultado</label>
              <select class="modal-select" [(ngModel)]="visitaForm.estadoVisita">
                <option value="POSITIVO">Positivo</option>
                <option value="NEGATIVO">Negativo</option>
                <option value="INDECISO">Indeciso</option>
                <option value="REPROGRAMADA">Reprogramada</option>
                <option value="NO_TRABAJABLE">No Trabajable</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Observaciones</label>
              <textarea class="modal-textarea" rows="3" [(ngModel)]="visitaForm.observaciones" placeholder="Ingrese observaciones..." autocomplete="off"></textarea>
            </div>
            <div class="modal-field">
              <label>Fotografía</label>
              <div class="file-upload">
                <i class="bi bi-camera"></i>
                <span>Adjuntar foto</span>
                <input type="file" accept="image/*" (change)="onFileSelected($event)">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeVisitaModal()">Cancelar</button>
            <button class="btn-save" (click)="guardarVisita()" [disabled]="savingVisita()">
              {{ savingVisita() ? 'Guardando...' : 'Guardar Visita' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page { height: calc(100vh - var(--header-height) - var(--space-6) * 2); display: flex; flex-direction: column; animation: fadeIn 0.3s ease-out; }

    .map-toolbar {
      display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4);
      background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xs); margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-3);
    }
    .toolbar-left, .toolbar-center, .toolbar-right { display: flex; align-items: center; gap: var(--space-2); }

    .search-box {
      display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3);
      background: var(--neutral-50); border: 1px solid var(--border-light); border-radius: var(--radius-md);
      height: 36px; min-width: 240px; transition: all var(--transition-fast);
      &:focus-within { border-color: var(--border-focus); background: var(--bg-surface); box-shadow: 0 0 0 3px rgba(61,107,61,0.08); }
      i { color: var(--text-tertiary); font-size: 0.875rem; }
      input { flex: 1; border: none; background: transparent; font-size: var(--text-sm); color: var(--text-primary); outline: none; &::placeholder { color: var(--text-tertiary); } }
    }

    .tool-btn {
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3);
      background: transparent; border: 1px solid transparent; border-radius: var(--radius-md);
      font-size: var(--text-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
      i { font-size: 0.9375rem; }
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.active { background: var(--primary-50); color: var(--primary-700); border-color: var(--primary-200); }
    }
    .tool-divider { width: 1px; height: 20px; background: var(--border-default); }

    .legend { display: flex; gap: var(--space-1); flex-wrap: wrap; }
    .legend-item {
      display: flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--text-secondary);
      padding: 4px 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md);
      background: var(--bg-surface); cursor: pointer; transition: all var(--transition-fast);
      &:hover { background: var(--bg-hover); border-color: var(--border-default); }
      &.dimmed { opacity: 0.4; border-style: dashed; }
    }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .legend-count { font-weight: 600; color: var(--text-primary); margin-left: 2px; }

    .map-wrapper { flex: 1; position: relative; border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--border-default); }
    .map-canvas { width: 100%; height: 100%; }
    .map-stats { position: absolute; bottom: 10px; left: 10px; z-index: 1000; background: rgba(0,0,0,0.75); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; }

    .info-panel {
      position: absolute; right: var(--space-4); top: var(--space-4); width: 280px;
      background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg); z-index: 1000; overflow: hidden; animation: slideInRight 0.2s ease-out;
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; padding: var(--space-4);
      background: linear-gradient(135deg, var(--primary-700), var(--primary-900));
      h5 { color: #fff; font-size: var(--text-base); font-weight: 600; margin: 0; }
    }
    .panel-close { background: rgba(255,255,255,0.15); border: none; color: #fff; width: 28px; height: 28px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: rgba(255,255,255,0.25); } }
    .panel-body { padding: var(--space-4); }
    .info-rows { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-label { font-size: var(--text-xs); color: var(--text-secondary); }
    .info-value { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }

    .panel-action-btn {
      width: 100%; padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md);
      background: var(--bg-surface); color: var(--text-primary); font-size: var(--text-sm); font-weight: 500;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      transition: all var(--transition-fast);
      &:hover { background: var(--bg-hover); border-color: var(--primary-300); }
      &.primary { background: var(--primary-600); color: #fff; border-color: var(--primary-600); &:hover { background: var(--primary-700); } }
    }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 480px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); color: var(--text-primary); } }
    .modal-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
    .modal-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); } }
    .radio-group { display: flex; gap: var(--space-2); }
    .radio-option { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); cursor: pointer; font-size: var(--text-sm); transition: all var(--transition-fast); input { display: none; } &.selected { background: var(--primary-50); border-color: var(--primary-300); color: var(--primary-700); } }
    .modal-select { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; &:focus { border-color: var(--border-focus); } }
    .modal-textarea { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; resize: vertical; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); } }
    .file-upload { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); border: 2px dashed var(--border-default); border-radius: var(--radius-lg); cursor: pointer; color: var(--text-secondary); font-size: var(--text-sm); transition: all var(--transition-fast); position: relative; &:hover { border-color: var(--primary-300); background: var(--primary-50); } input { position: absolute; inset: 0; opacity: 0; cursor: pointer; } }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-save { padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover:not(:disabled) { background: var(--primary-700); } &:disabled { opacity: 0.6; } }

    @keyframes slideInRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) {
      .map-toolbar { flex-direction: column; align-items: stretch; }
      .search-box { min-width: auto; }
      .legend { display: none; }
    }
  `]
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  private map: any;
  private manzanaLayer: any;
  private predioLayer: any;

  manzanas = signal<Manzana[]>([]);
  predios = signal<Predio[]>([]);
  selectedManzana = signal<Manzana | null>(null);
  selectedPredio = signal<Predio | null>(null);
  showManzanas = false;
  showPredios = true;
  showSpecialMarkers = signal(true);
  showVisitaModal = signal(false);
  savingVisita = signal(false);
  searchTerm = '';
  visitaForm: any = { idPredio: null, estadoVisita: 'POSITIVO', viviendaTrabajable: true, observaciones: '' };

  statusFilters: Record<string, boolean> = {
    'POSITIVO': true,
    'NEGATIVO': true,
    'INDECISO': true,
    'EN_BLANCO': false,
    'NO_TRABAJABLE': true,
  };

  statusCounts = signal<Record<string, number>>({});

  constructor(private manzanaService: ManzanaService, private predioService: PredioService, private visitaService: VisitaService, private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.initMap();
    this.loadManzanas();
    this.loadPredios();
    this.handleQueryParams();
  }

  private handleQueryParams() {
    const type = this.route.snapshot.queryParamMap.get('type');
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!type || !id) return;

    const numericId = +id;
    const checkAndCenter = () => {
      if (type === 'manzana') {
        const m = this.manzanas().find(m => m.idManzana === numericId);
        if (m) { this.selectedManzana.set(m); this.selectedPredio.set(null); this.centerOnManzana(m); return true; }
      } else if (type === 'predio') {
        const p = this.predios().find(p => p.idPredio === numericId);
        if (p) { this.selectedPredio.set(p); this.selectedManzana.set(null); this.centerOnPredio(p); return true; }
      }
      return false;
    };

    if (!checkAndCenter()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkAndCenter() || attempts > 20) clearInterval(interval);
      }, 500);
    }
  }
  ngOnDestroy() { if (this.map) this.map.remove(); }

  private initMap() {
    this.map = L.map('map').setView([0.811288, -77.716749], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }).addTo(this.map);
    this.manzanaLayer = L.layerGroup();
    this.predioLayer = L.layerGroup().addTo(this.map);
  }

  loadManzanas() {
    this.manzanaService.listarConPoligono().subscribe({
      next: (r) => {
        if (r.exitoso) { this.manzanas.set(r.datos); this.renderManzanas(); }
      },
      error: () => { this.manzanas.set([]); }
    });
  }

  loadPredios() {
    this.predioService.listarTodosActivos().subscribe({
      next: (r) => {
        if (r.exitoso) {
          this.predios.set(r.datos);
          this.computeStatusCounts();
          this.renderPredios();
        }
      },
      error: () => { this.predios.set([]); }
    });
  }

  private computeStatusCounts() {
    const counts: Record<string, number> = {
      'POSITIVO': 0, 'NEGATIVO': 0, 'INDECISO': 0, 'EN_BLANCO': 0, 'NO_TRABAJABLE': 0
    };
    this.predios().forEach(p => {
      const estado = p.estadoVisita || 'EN_BLANCO';
      if (counts[estado] !== undefined) counts[estado]++;
      else counts['EN_BLANCO']++;
    });
    this.statusCounts.set(counts);
  }

  isStatusVisible(key: string): boolean {
    return this.statusFilters[key] ?? true;
  }

  toggleStatusFilter(key: string) {
    this.statusFilters[key] = !this.statusFilters[key];
    this.renderPredios();
  }

  private renderManzanas() {
    this.manzanaLayer.clearLayers();
    this.manzanas().forEach(m => {
      if (m.poligonoGeoJSON) {
        try {
          const geo = JSON.parse(m.poligonoGeoJSON);
          const allRings = this.extractAllPolygonRings(geo);
          if (allRings.length > 0) {
            const polys = allRings.map(ring =>
              L.polygon(ring, { color: '#2b4d2b', weight: 2, fillColor: '#3d6b3d', fillOpacity: 0.08 })
            );
            const group = L.layerGroup(polys);
            group.eachLayer(layer => {
              (layer as L.Polygon).bindPopup(`<b>${m.nombre}</b><br>Clave: ${m.claveCatastralManzana}`);
              (layer as L.Polygon).on('click', () => { this.selectedManzana.set(m); this.selectedPredio.set(null); this.map.fitBounds((layer as L.Polygon).getBounds(), { padding: [50, 50] }); });
            });
            this.manzanaLayer.addLayer(group);
          }
        } catch (e) { console.error(`Error renderizando manzana "${m.nombre}":`, e); }
      }
    });
  }

  private extractAllPolygonRings(geo: any): Array<Array<[number, number]>> {
    const source = geo?.type === 'FeatureCollection' ? geo.features?.[0]?.geometry : geo;
    if (!source || !source.coordinates) return [];

    let rings: number[][][][] = [];
    if (source.type === 'MultiPolygon') {
      rings = source.coordinates;
    } else if (source.type === 'Polygon') {
      rings = [source.coordinates];
    } else {
      return [];
    }

    return rings.map(polygon => {
      const ring = polygon[0];
      if (!Array.isArray(ring)) return [];
      return ring.map((point: number[]) => {
        const [x, y] = point;
        if (typeof x !== 'number' || typeof y !== 'number') return [0, 0] as [number, number];
        if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
          return [y, x] as [number, number];
        }
        const projected = this.utmToLatLng(x, y, 17, 'N');
        return [projected.lat, projected.lng] as [number, number];
      }).filter((p: [number, number]) => p[0] !== 0 || p[1] !== 0);
    }).filter(ring => ring.length > 0);
  }

  private utmToLatLng(easting: number, northing: number, zone: number, hemisphere: string): { lat: number; lng: number } {
    const a = 6378137.0;
    const ecc2 = 0.00669438;
    const eccPrime2 = ecc2 / (1 - ecc2);
    const e1 = (1 - Math.sqrt(1 - ecc2)) / (1 + Math.sqrt(1 - ecc2));
    const lon0 = (zone * 6 - 183) * Math.PI / 180;

    const m = northing;
    const mu = m / (a * (1 - ecc2 / 4 - 3 * ecc2 * ecc2 / 64 - 5 * ecc2 * ecc2 * ecc2 / 256));
    const phi1 = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
      + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
      + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);

    const c1 = eccPrime2 * Math.cos(phi1) * Math.cos(phi1);
    const t1 = Math.tan(phi1) * Math.tan(phi1);
    const n1 = a / Math.sqrt(1 - ecc2 * Math.sin(phi1) * Math.sin(phi1));
    const r1 = a * (1 - ecc2) / Math.pow(1 - ecc2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
    const d = easting / (n1 * 1.0);

    const lat = phi1 - (n1 * Math.tan(phi1) / r1) * (
      d * d / 2
      - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * eccPrime2) * Math.pow(d, 4) / 24
      + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * eccPrime2 - 3 * c1 * c1) * Math.pow(d, 6) / 720
    );
    const lng = lon0 + (
      d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6
      + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * eccPrime2 + 24 * t1 * t1) * Math.pow(d, 5) / 120
    ) / Math.cos(phi1);

    return {
      lat: lat * 180 / Math.PI,
      lng: lng * 180 / Math.PI
    };
  }

  private renderPredios() {
    this.predioLayer.clearLayers();
    const showMarkers = this.showSpecialMarkers();
    this.predios().forEach(p => {
      const estado = p.estadoVisita || 'EN_BLANCO';
      if (!this.isStatusVisible(estado)) return;

      if (p.poligonoGeoJSON) {
        try {
          const geo = JSON.parse(p.poligonoGeoJSON);
          const allRings = this.extractAllPolygonRings(geo);
          if (allRings.length > 0) {
            const color = this.getMarkerColor(p.estadoVisita);
            const polys = allRings.map(ring =>
              L.polygon(ring, { color, weight: 1.5, fillColor: color, fillOpacity: 0.15 })
            );
            const group = L.layerGroup(polys);
            let popupHtml = `<b>${p.claveCatastral}</b><br>${p.propietario || ''}<br><span style="color:${color}">${p.estadoVisita || 'En Blanco'}</span>`;
            if (showMarkers && p.estrella) popupHtml += '<br><span style="color:#F59E0B">&#9733; Estrella</span>';
            if (showMarkers && p.apoyaAlcalde) popupHtml += '<br><span style="color:#2563EB">&#9786; Apoya Alcalde</span>';
            group.eachLayer(layer => {
              (layer as L.Polygon).bindPopup(popupHtml);
              (layer as L.Polygon).on('click', () => { this.selectedPredio.set(p); this.selectedManzana.set(null); });
            });
            this.predioLayer.addLayer(group);
            if (showMarkers && p.poligonoGeoJSON) {
              try {
                const rings = this.extractAllPolygonRings(geo);
                if (rings.length > 0 && rings[0].length > 0) {
                  const centroid = rings[0].reduce((acc: [number, number], c: [number, number]) => [acc[0]+c[0], acc[1]+c[1]], [0, 0]);
                  const center: [number, number] = [centroid[0]/rings[0].length, centroid[1]/rings[0].length];
                  if (p.estrella) {
                    const starIcon = L.divIcon({
                      className: 'star-marker',
                      html: '<div style="color:#F59E0B;font-size:18px;text-shadow:0 0 4px rgba(0,0,0,0.5);line-height:1">&#9733;</div>',
                      iconSize: [20, 20], iconAnchor: [10, 10]
                    });
                    L.marker(center, { icon: starIcon }).addTo(this.predioLayer);
                  }
                  if (p.apoyaAlcalde) {
                    const personIcon = L.divIcon({
                      className: 'person-marker',
                      html: '<div style="color:#2563EB;font-size:16px;text-shadow:0 0 4px rgba(0,0,0,0.5);line-height:1">&#9786;</div>',
                      iconSize: [18, 18], iconAnchor: [9, 9]
                    });
                    L.marker(center, { icon: personIcon }).addTo(this.predioLayer);
                  }
                }
              } catch (e) { /* skip marker on error */ }
            }
          }
        } catch (e) {
          console.error(`Error renderizando poligono predio "${p.claveCatastral}":`, e);
        }
      } else if (p.latitud && p.longitud) {
        const color = this.getMarkerColor(p.estadoVisita);
        const marker = L.circleMarker([p.latitud, p.longitud], { radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9 });
        marker.bindPopup(`<b>${p.claveCatastral}</b><br>${p.propietario}<br><span style="color:${color}">${p.estadoVisita || 'En Blanco'}</span>`);
        marker.on('click', () => { this.selectedPredio.set(p); this.selectedManzana.set(null); });
        this.predioLayer.addLayer(marker);
        if (showMarkers && p.estrella) {
          const starIcon = L.divIcon({
            className: 'star-marker',
            html: '<div style="color:#F59E0B;font-size:18px;text-shadow:0 0 4px rgba(0,0,0,0.5);line-height:1">&#9733;</div>',
            iconSize: [20, 20], iconAnchor: [10, 10]
          });
          L.marker([p.latitud, p.longitud], { icon: starIcon }).addTo(this.predioLayer);
        }
        if (showMarkers && p.apoyaAlcalde) {
          const personIcon = L.divIcon({
            className: 'person-marker',
            html: '<div style="color:#2563EB;font-size:16px;text-shadow:0 0 4px rgba(0,0,0,0.5);line-height:1">&#9786;</div>',
            iconSize: [18, 18], iconAnchor: [9, 9]
          });
          L.marker([p.latitud, p.longitud], { icon: personIcon }).addTo(this.predioLayer);
        }
      }
    });
  }

  private getMarkerColor(estado?: string): string {
    switch (estado) {
      case 'POSITIVO': return '#2563EB';
      case 'NEGATIVO': return '#DC2626';
      case 'INDECISO': return '#F59E0B';
      case 'NO_TRABAJABLE': return '#1C1C1C';
      default: return '#6B7280';
    }
  }

  toggleLayer(layer: string) {
    if (layer === 'manzanas') {
      this.showManzanas = !this.showManzanas;
      this.showManzanas ? this.map.addLayer(this.manzanaLayer) : this.map.removeLayer(this.manzanaLayer);
    }
    if (layer === 'predios') {
      this.showPredios = !this.showPredios;
      this.showPredios ? this.map.addLayer(this.predioLayer) : this.map.removeLayer(this.predioLayer);
    }
  }

  toggleSpecialMarkers() {
    this.showSpecialMarkers.update(v => !v);
    this.renderPredios();
  }

  clearSelection() { this.selectedManzana.set(null); this.selectedPredio.set(null); }

  buscarPredio() {
    if (!this.searchTerm) return;
    const p = this.predios().find(p => p.claveCatastral.toLowerCase().includes(this.searchTerm.toLowerCase()));
    if (p && p.latitud && p.longitud) { this.selectedPredio.set(p); this.map.setView([p.latitud, p.longitud], 17); }
  }

  centerOnManzana(m: Manzana) {
    if (!m.poligonoGeoJSON) return;
    try {
      const geo = JSON.parse(m.poligonoGeoJSON);
      const rings = this.extractAllPolygonRings(geo);
      if (rings.length > 0) {
        const allCoords = rings.flat();
        if (allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords);
          this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
          const polys = rings.map(ring =>
            L.polygon(ring, { color: '#ff6600', weight: 3, fillColor: '#ff6600', fillOpacity: 0.2 })
          );
          const highlight = L.layerGroup(polys);
          highlight.addTo(this.map);
          setTimeout(() => { this.map.removeLayer(highlight); }, 5000);
        }
      }
    } catch (e) { console.error('Error centrandom manzana:', e); }
  }

  centerOnPredio(p: Predio) {
    if (p.poligonoGeoJSON) {
      try {
        const geo = JSON.parse(p.poligonoGeoJSON);
        const rings = this.extractAllPolygonRings(geo);
        if (rings.length > 0) {
          const allCoords = rings.flat();
          if (allCoords.length > 0) {
            const bounds = L.latLngBounds(allCoords);
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            const polys = rings.map(ring =>
              L.polygon(ring, { color: '#ff6600', weight: 3, fillColor: '#ff6600', fillOpacity: 0.2 })
            );
            const highlight = L.layerGroup(polys);
            highlight.addTo(this.map);
            setTimeout(() => { this.map.removeLayer(highlight); }, 5000);
          }
        }
      } catch (e) { console.error('Error centrandom predio:', e); }
    } else if (p.latitud && p.longitud) {
      this.map.setView([p.latitud, p.longitud], 18);
      const marker = L.circleMarker([p.latitud, p.longitud], { radius: 10, fillColor: '#ff6600', color: '#fff', weight: 3, fillOpacity: 0.5 });
      marker.addTo(this.map);
      setTimeout(() => { this.map.removeLayer(marker); }, 5000);
    }
  }

  verPrediosManzana() {
    const m = this.selectedManzana();
    if (m) this.predioService.listarPorManzana(m.idManzana!).subscribe({ next: (r) => { if (r.exitoso) { this.predios.set(r.datos); this.computeStatusCounts(); this.renderPredios(); } } });
  }

  registrarVisita() { const p = this.selectedPredio(); if (p) { this.visitaForm.idPredio = p.idPredio; this.showVisitaModal.set(true); } }
  closeVisitaModal() { this.showVisitaModal.set(false); this.visitaForm = { idPredio: null, estadoVisita: 'POSITIVO', viviendaTrabajable: true, observaciones: '' }; }
  onFileSelected(event: any) {}

  guardarVisita() {
    this.savingVisita.set(true);
    const v: any = { idPredio: this.visitaForm.idPredio, estadoVisita: this.visitaForm.estadoVisita, viviendaTrabajable: this.visitaForm.viviendaTrabajable, observaciones: this.visitaForm.observaciones, fechaVisita: new Date().toISOString(), latitudVisita: this.selectedPredio()?.latitud, longitudVisita: this.selectedPredio()?.longitud };
    this.visitaService.crear(v).subscribe({ next: (r) => { this.savingVisita.set(false); if (r.exitoso) { this.closeVisitaModal(); this.loadPredios(); } }, error: () => { this.savingVisita.set(false); } });
  }

  getEstadoBadge(estado?: string): string { switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; default: return 'badge-neutral'; } }
}
