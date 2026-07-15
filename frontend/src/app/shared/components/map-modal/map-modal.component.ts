import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Predio, Manzana } from '../../../core/models/models';

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-map-card" (click)="$event.stopPropagation()">
        <div class="modal-map-header">
          <h5>{{ title }}</h5>
          <button class="modal-close" (click)="close.emit()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-map-body">
          <div #mapContainer class="modal-map-container"></div>

          <div class="sidebar" *ngIf="predios.length > 0 || manzana">
            <div class="sidebar-section manzana-info" [class.active-section]="!predioSeleccionado" (click)="seleccionarManzana()">
              <div class="section-header">
                <i class="bi bi-grid-3x3-gap"></i>
                <span>{{ manzana?.nombre || 'Manzana' }}</span>
                <i class="bi bi-chevron-right sidebar-arrow"></i>
              </div>
              <div class="section-body" *ngIf="!predioSeleccionado">
                <div class="info-row"><span class="info-label">Clave</span><span class="info-value">{{ manzana?.claveCatastralManzana || '—' }}</span></div>
                <div class="info-row"><span class="info-label">Predios</span><span class="info-value">{{ predios.length }}</span></div>
                <div class="info-row"><span class="info-label">Sector</span><span class="info-value">{{ manzana?.sector || '—' }}</span></div>
                <div class="info-row"><span class="info-label">Barrio</span><span class="info-value">{{ manzana?.barrio || '—' }}</span></div>
              </div>
            </div>

            <div class="sidebar-section predios-list">
              <div class="section-header non-clickable">
                <i class="bi bi-house-door"></i>
                <span>Predios ({{ predios.length }})</span>
              </div>
              <div class="predios-scroll">
                <div
                  *ngFor="let p of predios"
                  class="predio-item"
                  [class.selected]="predioSeleccionado?.idPredio === p.idPredio"
                  (click)="seleccionarPredio(p)">
                  <div class="predio-name">{{ p.claveCatastral }}</div>
                  <div class="predio-meta">{{ p.propietario || 'Sin propietario' }}</div>
                  <span class="predio-badge" [ngClass]="getEstadoBadgeClass(p.estadoVisita)">{{ p.estadoVisita || 'Sin visita' }}</span>
                </div>
                <div class="empty-predios" *ngIf="predios.length === 0">
                  <i class="bi bi-inbox"></i>
                  <span>No hay predios en esta manzana</span>
                </div>
              </div>
            </div>

            <div class="sidebar-section predio-detail" *ngIf="predioSeleccionado">
              <div class="section-header non-clickable">
                <i class="bi bi-info-circle"></i>
                <span>Detalle Predio</span>
              </div>
              <div class="section-body">
                <div class="info-row"><span class="info-label">Clave</span><span class="info-value">{{ predioSeleccionado.claveCatastral }}</span></div>
                <div class="info-row"><span class="info-label">Propietario</span><span class="info-value">{{ predioSeleccionado.propietario || '—' }}</span></div>
                <div class="info-row"><span class="info-label">Dirección</span><span class="info-value">{{ predioSeleccionado.direccion || '—' }}</span></div>
                <div class="info-row"><span class="info-label">Estado</span><span class="info-value"><span class="predio-badge" [ngClass]="getEstadoBadgeClass(predioSeleccionado.estadoVisita)">{{ predioSeleccionado.estadoVisita || 'Sin visita' }}</span></span></div>
                <button class="btn-add-visit" (click)="onCrearVisita()">
                  <i class="bi bi-clipboard-plus"></i> Agregar Visita
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .modal-map-card { background: var(--bg-surface); border-radius: var(--radius-xl); width: 95vw; max-width: 1200px; height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-map-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .modal-map-header h5 { margin: 0; font-size: var(--text-base); font-weight: 600; color: var(--text-primary); }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
    .modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
    .modal-map-body { flex: 1; position: relative; display: flex; overflow: hidden; }
    .modal-map-container { flex: 1; min-width: 0; }

    .sidebar { width: 340px; display: flex; flex-direction: column; border-left: 1px solid var(--border-light); overflow: hidden; }
    .sidebar-section { border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background var(--transition-fast); }
    .sidebar-section:hover { background: var(--bg-hover); }
    .sidebar-section.active-section { background: var(--primary-50); }
    .sidebar-section.active-section .section-header { color: var(--primary-700); }
    .section-header { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); user-select: none; }
    .section-header.non-clickable { cursor: default; }
    .section-header.non-clickable:hover { background: transparent; }
    .section-header i:first-child { color: var(--text-secondary); font-size: var(--text-sm); }
    .sidebar-arrow { margin-left: auto; color: var(--text-tertiary); font-size: 10px; transition: transform 0.2s; }
    .section-body { padding: var(--space-3) var(--space-4); }
    .info-row { display: flex; justify-content: space-between; padding: var(--space-1) 0; font-size: var(--text-xs); }
    .info-label { color: var(--text-secondary); }
    .info-value { color: var(--text-primary); font-weight: 500; text-align: right; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .predios-list { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
    .predios-scroll { flex: 1; overflow-y: auto; }
    .predio-item { padding: var(--space-2) var(--space-4); cursor: pointer; border-left: 3px solid transparent; transition: all var(--transition-fast); }
    .predio-item:hover { background: var(--bg-hover); }
    .predio-item.selected { background: var(--primary-50); border-left-color: var(--primary-600); }
    .predio-name { font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); }
    .predio-meta { font-size: 10px; color: var(--text-secondary); margin-top: 1px; }
    .predio-badge { display: inline-block; margin-top: 2px; font-size: 9px; padding: 0 6px; border-radius: var(--radius-full); font-weight: 500; }
    .predio-badge.badge-success { background: rgba(34,197,94,0.15); color: #22c55e; }
    .predio-badge.badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; }
    .predio-badge.badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .predio-badge.badge-neutral { background: var(--neutral-150); color: var(--text-secondary); }
    .empty-predios { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-6); color: var(--text-tertiary); font-size: var(--text-xs); }
    .empty-predios i { font-size: 1.5rem; }

    .predio-detail { cursor: default; }
    .predio-detail .btn-add-visit { display: flex; align-items: center; justify-content: center; gap: var(--space-2); width: 100%; padding: var(--space-2); margin-top: var(--space-3); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
    .predio-detail .btn-add-visit:hover { background: var(--primary-700); }
    .predio-detail .btn-add-visit i { font-size: var(--text-sm); }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MapModalComponent implements AfterViewInit, OnChanges {
  @Input() title = 'Ver en Mapa';
  @Input() geoJSON: string | null = null;
  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  @Input() color = '#22c55e';
  @Input() itemName = '';
  @Input() predios: Predio[] = [];
  @Input() manzana: Manzana | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() crearVisita = new EventEmitter<Predio>();

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map: L.Map | null = null;

  predioSeleccionado: Predio | null = null;

  private manzanaLayer: L.Layer | null = null;
  private predioLayers = new Map<number, L.Layer>();
  private manzanaHighlightStyle = { weight: 4, fillOpacity: 0.3 };
  private manzanaNormalStyle = { weight: 3, fillOpacity: 0.15 };
  private predioHighlightStyle = { weight: 3, fillOpacity: 0.5 };
  private predioNormalStyle = { weight: 2, fillOpacity: 0.3 };

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['geoJSON'] || changes['latitud'] || changes['predios'])) {
      this.drawItem();
    }
  }

  private initMap() {
    if (!this.mapContainer) return;
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true
    }).setView([0.811288, -77.716749], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
      maxZoom: 19
    }).addTo(this.map);
    setTimeout(() => {
      this.map?.invalidateSize();
      this.drawItem();
    }, 300);
  }

  seleccionarManzana() {
    this.predioSeleccionado = null;
    this.resaltarManzana(true);
    this.resaltarTodosPredios(false);
    if (this.manzana && this.geoJSON) {
      this.zoomToGeoJSON(this.geoJSON);
    }
  }

  seleccionarPredio(p: Predio) {
    if (this.predioSeleccionado?.idPredio === p.idPredio) {
      this.predioSeleccionado = null;
      this.resaltarTodosPredios(false);
      this.resaltarManzana(true);
      return;
    }
    this.predioSeleccionado = p;
    this.resaltarManzana(false);
    this.resaltarTodosPredios(false);
    this.resaltarPredio(p.idPredio!, true);
    if (p.poligonoGeoJSON) {
      this.zoomToGeoJSON(p.poligonoGeoJSON);
    } else if (p.latitud && p.longitud) {
      this.map?.setView([p.latitud, p.longitud], 18);
    }
  }

  onCrearVisita() {
    if (this.predioSeleccionado) {
      this.crearVisita.emit(this.predioSeleccionado);
    }
  }

  getEstadoBadgeClass(estado: string | undefined): string {
    if (!estado) return 'badge-neutral';
    switch (estado) {
      case 'POSITIVO': return 'badge-success';
      case 'NEGATIVO': return 'badge-danger';
      case 'INDECISO': return 'badge-warning';
      default: return 'badge-neutral';
    }
  }

  private drawItem() {
    if (!this.map) return;

    this.map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) {
        this.map?.removeLayer(layer);
      }
    });
    this.manzanaLayer = null;
    this.predioLayers.clear();

    const overlay = L.layerGroup();
    let bounds: L.LatLngBounds | null = null;

    if (this.geoJSON) {
      try {
        const geo = JSON.parse(this.geoJSON);
        const rings = this.extractRings(geo);
        if (rings.length > 0) {
          rings.forEach(ring => {
            const poly = L.polygon(ring, {
              color: this.color,
              weight: 3,
              fillColor: this.color,
              fillOpacity: 0.15
            });
            poly.on('click', (e: L.LeafletEvent) => {
              L.DomEvent.stop(e);
              this.seleccionarManzana();
            });
            overlay.addLayer(poly);
            this.manzanaLayer = poly;
          });
          const allCoords = rings.flat();
          bounds = L.latLngBounds(allCoords);
        }
      } catch (e) { console.error('Error parsing geoJSON:', e); }
    }

    if (!bounds && this.latitud && this.longitud) {
      const marker = L.circleMarker([this.latitud, this.longitud], {
        radius: 10,
        fillColor: this.color,
        color: '#fff',
        weight: 3,
        fillOpacity: 0.9
      });
      marker.on('click', (e: L.LeafletEvent) => {
        L.DomEvent.stop(e);
        this.seleccionarManzana();
      });
      overlay.addLayer(marker);
      this.manzanaLayer = marker;
      bounds = L.latLngBounds([[this.latitud, this.longitud]]);
    }

    this.drawPrediosOnMap(overlay);

    if (bounds) {
      overlay.addTo(this.map);
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else if (this.predios.length > 0) {
      overlay.addTo(this.map);
    }
  }

  private drawPrediosOnMap(overlay: L.LayerGroup) {
    this.predios.forEach(p => {
      if (p.poligonoGeoJSON) {
        try {
          const geo = JSON.parse(p.poligonoGeoJSON);
          const rings = this.extractRings(geo);
          rings.forEach(ring => {
            const poly = L.polygon(ring, {
              color: '#f59e0b',
              weight: 2,
              fillColor: '#f59e0b',
              fillOpacity: 0.3
            });
            poly.on('click', (e: L.LeafletEvent) => {
              L.DomEvent.stop(e);
              this.seleccionarPredio(p);
            });
            overlay.addLayer(poly);
            if (p.idPredio) this.predioLayers.set(p.idPredio, poly);
          });
        } catch (e) {}
      } else if (p.latitud && p.longitud) {
        const marker = L.circleMarker([p.latitud, p.longitud], {
          radius: 6,
          fillColor: '#f59e0b',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        });
        marker.on('click', (e: L.LeafletEvent) => {
          L.DomEvent.stop(e);
          this.seleccionarPredio(p);
        });
        overlay.addLayer(marker);
        if (p.idPredio) this.predioLayers.set(p.idPredio, marker);
      }
    });
  }

  private resaltarManzana(active: boolean) {
    if (!this.manzanaLayer) return;
    const style = active ? this.manzanaHighlightStyle : this.manzanaNormalStyle;
    if ('setStyle' in this.manzanaLayer) {
      (this.manzanaLayer as any).setStyle(style);
    }
  }

  private resaltarPredio(idPredio: number, active: boolean) {
    const layer = this.predioLayers.get(idPredio);
    if (!layer || !('setStyle' in layer)) return;
    const style = active ? this.predioHighlightStyle : this.predioNormalStyle;
    (layer as any).setStyle(style);
  }

  private resaltarTodosPredios(active: boolean) {
    this.predioLayers.forEach((layer) => {
      if ('setStyle' in layer) {
        const style = active ? this.predioHighlightStyle : this.predioNormalStyle;
        (layer as any).setStyle(style);
      }
    });
  }

  private zoomToGeoJSON(geoJSONStr: string) {
    try {
      const geo = JSON.parse(geoJSONStr);
      const rings = this.extractRings(geo);
      if (rings.length > 0) {
        const allCoords = rings.flat();
        const bounds = L.latLngBounds(allCoords);
        this.map?.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
      }
    } catch (e) {}
  }

  private extractRings(geo: any): Array<Array<[number, number]>> {
    const source = geo?.type === 'FeatureCollection' ? geo.features?.[0]?.geometry : geo;
    if (!source || !source.coordinates) return [];

    let raw: number[][][][] = [];
    if (source.type === 'MultiPolygon') raw = source.coordinates;
    else if (source.type === 'Polygon') raw = [source.coordinates];
    else return [];

    return raw.map(polygon => {
      const ring = polygon[0];
      if (!Array.isArray(ring)) return [];
      return ring.map((point: number[]) => {
        const [x, y] = point;
        if (typeof x !== 'number' || typeof y !== 'number') return [0, 0] as [number, number];
        if (Math.abs(x) <= 180 && Math.abs(y) <= 90) return [y, x] as [number, number];
        return [0, 0] as [number, number];
      }).filter((p: [number, number]) => p[0] !== 0 || p[1] !== 0);
    }).filter(ring => ring.length > 0);
  }
}
