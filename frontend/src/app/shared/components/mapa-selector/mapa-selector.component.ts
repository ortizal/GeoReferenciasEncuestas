import { Component, EventEmitter, Input, OnDestroy, Output, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-selector',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ms-overlay" role="dialog" aria-modal="true">
      <div class="ms-header">
        <div class="ms-title">
          <i class="bi" [ngClass]="mode === 'polygon' ? 'bi-pentagon' : 'bi-geo-alt'"></i>
          <span>{{ mode === 'polygon' ? 'Dibuje el polígono en el mapa' : 'Seleccione la ubicación en el mapa' }}</span>
        </div>
        <div class="ms-actions">
          <span class="ms-hint" *ngIf="mode === 'polygon'">{{ points.length < 3 ? 'Click para agregar puntos (' + points.length + ')' : 'Doble-click para finalizar (' + points.length + ' puntos)' }}</span>
          <span class="ms-hint" *ngIf="mode === 'point'">{{ selectedPoint ? 'Punto seleccionado' : 'Click en el mapa para ubicar el punto' }}</span>
          <button class="ms-btn" (click)="cancelar()"><i class="bi bi-x-lg"></i> Cancelar</button>
          <button class="ms-btn" *ngIf="mode === 'polygon' && points.length > 0" (click)="deshacer()"><i class="bi bi-arrow-counterclockwise"></i> Deshacer</button>
          <button class="ms-btn ms-btn-danger" *ngIf="mode === 'polygon' && points.length > 0" (click)="limpiar()"><i class="bi bi-trash"></i> Limpiar</button>
          <button class="ms-btn ms-btn-confirm" [disabled]="!isValid()" (click)="confirmar()"><i class="bi bi-check-lg"></i> Confirmar</button>
        </div>
      </div>
      <div #mapContainer class="ms-map"></div>
    </div>
  `,
  styles: [`
    .ms-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
    .ms-header {
      display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;
      background: linear-gradient(135deg, #2b5a2b, #1a3a1a); color: #fff; flex-shrink: 0;
      flex-wrap: wrap; gap: 8px; min-height: 52px;
    }
    .ms-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .ms-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .ms-hint { font-size: 12px; opacity: 0.85; margin-right: 4px; }
    .ms-btn {
      padding: 5px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 5px;
      background: transparent; color: #fff; font-size: 12px; cursor: pointer; white-space: nowrap;
    }
    .ms-btn:hover { background: rgba(255,255,255,0.1); }
    .ms-btn-danger { border-color: rgba(255,100,100,0.5); color: #ffaaaa; }
    .ms-btn-danger:hover { background: rgba(255,100,100,0.15); }
    .ms-btn-confirm { background: #22c55e; border-color: #22c55e; font-weight: 500; }
    .ms-btn-confirm:hover:not(:disabled) { background: #16a34a; }
    .ms-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .ms-map { flex: 1; min-height: 0; width: 100%; height: 100%; display: block; background: #f5f6f7; }
  `]
})
export class MapaSelectorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @Input() mode: 'polygon' | 'point' = 'polygon';
  @Input() center: [number, number] = [-0.1807, -78.4678];
  @Input() zoom = 15;
  @Input() initialPolygon: [number, number][] = [];
  @Input() initialPoint: [number, number] | null = null;
  @Output() confirmed = new EventEmitter<{ polygon?: [number, number][]; point?: [number, number]; geoJSON?: any }>();
  @Output() cancelled = new EventEmitter<void>();

  private map: L.Map | null = null;
  points: [number, number][] = [];
  selectedPoint: [number, number] | null = null;
  private tempMarkers: L.CircleMarker[] = [];
  private tempLine: L.Polyline | null = null;
  private tempPolygon: L.Polygon | null = null;
  private pointMarker: L.Marker | null = null;
  private drawingTempLine: L.Polyline | null = null;
  private resizeHandler: (() => void) | null = null;
  private initialized = false;
  private initAttempts = 0;

  ngAfterViewInit() {
    this.resizeHandler = () => {
      if (this.map) {
        this.map.invalidateSize({ pan: false });
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    requestAnimationFrame(() => this.initMap());
  }

  ngOnDestroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private initMap() {
    if (this.initialized) return;

    const el = this.mapContainer?.nativeElement;
    if (!el) {
      if (this.initAttempts < 12) {
        this.initAttempts += 1;
        requestAnimationFrame(() => this.initMap());
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      if (this.initAttempts < 12) {
        this.initAttempts += 1;
        setTimeout(() => this.initMap(), 120);
      }
      return;
    }

    this.initialized = true;
    this.initAttempts = 0;

    this.map = L.map(el, { zoomControl: true, zoomSnap: 0.25 }).setView(this.center, this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM', maxZoom: 19
    }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize({ pan: false });
          if (this.mode === 'point' && this.initialPoint) {
            this.selectedPoint = [...this.initialPoint];
            this.renderPoint();
          }
        }
      }, 150);
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize({ pan: false });
        }
      }, 400);
    });

    if (this.mode === 'polygon' && this.initialPolygon.length > 0) {
      this.points = [...this.initialPolygon];
      this.renderPolygon();
      setTimeout(() => {
        if (this.map && this.points.length > 0) {
          this.map.fitBounds(L.latLngBounds(this.points), { padding: [50, 50] });
        }
      }, 150);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
    this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if (this.mode === 'polygon' && this.points.length >= 3) {
        this.confirmar();
      }
    });

    if (this.mode === 'polygon') {
      this.map.on('mousemove', (e: L.LeafletMouseEvent) => this.onMouseMove(e));
    }
  }

  private onMapClick(e: L.LeafletMouseEvent) {
    const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];

    if (this.mode === 'polygon') {
      this.points.push(latlng);
      this.renderPolygon();
    } else {
      this.selectedPoint = latlng;
      this.renderPoint();
    }
  }

  private onMouseMove(e: L.LeafletMouseEvent) {
    if (this.mode !== 'polygon' || this.points.length === 0 || !this.map) return;

    if (this.drawingTempLine) {
      this.map.removeLayer(this.drawingTempLine);
    }

    const lastPoint = this.points[this.points.length - 1];
    this.drawingTempLine = L.polyline([lastPoint, [e.latlng.lat, e.latlng.lng]], {
      color: '#3d6b3d', weight: 2, dashArray: '6 4', opacity: 0.7
    }).addTo(this.map);
  }

  private renderPolygon() {
    if (!this.map) return;

    if (this.tempPolygon) { this.map.removeLayer(this.tempPolygon); this.tempPolygon = null; }
    this.tempMarkers.forEach(m => this.map!.removeLayer(m));
    this.tempMarkers = [];
    if (this.drawingTempLine) { this.map.removeLayer(this.drawingTempLine); this.drawingTempLine = null; }

    this.points.forEach((p, i) => {
      const marker = L.circleMarker(p, {
        radius: 6, fillColor: '#3d6b3d', color: '#fff', weight: 2, fillOpacity: 0.9
      }).addTo(this.map!);
      marker.bindTooltip(`${i + 1}`, { permanent: true, direction: 'top' });
      this.tempMarkers.push(marker);
    });

    if (this.points.length >= 3) {
      this.tempPolygon = L.polygon(this.points, {
        color: '#2b4d2b', weight: 2, fillColor: '#3d6b3d', fillOpacity: 0.15
      }).addTo(this.map);
    }

    if (this.points.length > 1 && this.points.length < 3) {
      this.tempLine = L.polyline(this.points, {
        color: '#3d6b3d', weight: 2, dashArray: '6 4'
      }).addTo(this.map);
    } else if (this.tempLine && this.points.length >= 3) {
      this.map.removeLayer(this.tempLine);
      this.tempLine = null;
    }
  }

  private renderPoint() {
    if (!this.map || !this.selectedPoint) return;

    if (this.pointMarker) { this.map.removeLayer(this.pointMarker); this.pointMarker = null; }

    this.pointMarker = L.marker(this.selectedPoint, {
      icon: L.divIcon({
        className: '',
        html: `<div style="background:#3d6b3d;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      })
    }).addTo(this.map);

    this.pointMarker.bindPopup(
      `<b>Ubicación seleccionada</b><br>Lat: ${this.selectedPoint[0].toFixed(8)}<br>Lng: ${this.selectedPoint[1].toFixed(8)}`
    ).openPopup();

    this.map.setView(this.selectedPoint, Math.max(this.map.getZoom(), 17));
  }

  deshacer() {
    if (this.points.length > 0) {
      this.points.pop();
      this.renderPolygon();
    }
  }

  limpiar() {
    this.points = [];
    this.renderPolygon();
  }

  isValid(): boolean {
    if (this.mode === 'polygon') return this.points.length >= 3;
    return this.selectedPoint !== null;
  }

  confirmar() {
    if (!this.isValid()) return;

    if (this.mode === 'polygon') {
      const geoJSON = {
        type: 'Polygon',
        coordinates: [this.points.map(p => [p[1], p[0]])]
      };
      this.confirmed.emit({ polygon: this.points, geoJSON });
    } else {
      this.confirmed.emit({ point: this.selectedPoint! });
    }
  }

  cancelar() {
    this.cancelled.emit();
  }
}
