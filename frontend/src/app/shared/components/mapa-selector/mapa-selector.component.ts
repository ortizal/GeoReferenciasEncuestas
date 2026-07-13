import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selector-overlay">
      <div class="selector-header">
        <div class="selector-title">
          <i class="bi" [ngClass]="mode === 'polygon' ? 'bi-pentagon' : 'bi-geo-alt'"></i>
          <span>{{ mode === 'polygon' ? 'Dibuje el polígono en el mapa' : 'Seleccione la ubicación en el mapa' }}</span>
        </div>
        <div class="selector-actions">
          <span class="selector-hint" *ngIf="mode === 'polygon'">{{ points.length < 3 ? 'Click para agregar puntos (' + points.length + ')' : 'Doble-click para finalizar (' + points.length + ' puntos)' }}</span>
          <span class="selector-hint" *ngIf="mode === 'point'">{{ selectedPoint ? 'Punto seleccionado' : 'Click en el mapa para ubicar el punto' }}</span>
          <button class="btn-selector-cancel" (click)="cancelar()"><i class="bi bi-x-lg"></i> Cancelar</button>
          <button class="btn-selector-undo" *ngIf="mode === 'polygon' && points.length > 0" (click)="deshacer()"><i class="bi bi-arrow-counterclockwise"></i> Deshacer</button>
          <button class="btn-selector-clear" *ngIf="mode === 'polygon' && points.length > 0" (click)="limpiar()"><i class="bi bi-trash"></i> Limpiar</button>
          <button class="btn-selector-confirm" [disabled]="!isValid()" (click)="confirmar()"><i class="bi bi-check-lg"></i> Confirmar</button>
        </div>
      </div>
      <div id="selector-map" class="selector-map"></div>
    </div>
  `,
  styles: [`
    .selector-overlay { position: fixed; inset: 0; z-index: 3000; background: var(--bg-surface, #fff); display: flex; flex-direction: column; animation: fadeIn 0.2s ease-out; }
    .selector-header {
      display: flex; justify-content: space-between; align-items: center; padding: 12px 20px;
      background: linear-gradient(135deg, var(--primary-700, #2b5a2b), var(--primary-900, #1a3a1a));
      color: #fff; flex-shrink: 0; flex-wrap: wrap; gap: 8px;
    }
    .selector-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; }
    .selector-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .selector-hint { font-size: 12px; opacity: 0.85; margin-right: 8px; }
    .btn-selector-cancel {
      padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px;
      background: transparent; color: #fff; font-size: 13px; cursor: pointer;
    }
    .btn-selector-cancel:hover { background: rgba(255,255,255,0.1); }
    .btn-selector-undo {
      padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px;
      background: transparent; color: #fff; font-size: 13px; cursor: pointer;
    }
    .btn-selector-undo:hover { background: rgba(255,255,255,0.1); }
    .btn-selector-clear {
      padding: 6px 14px; border: 1px solid rgba(255,100,100,0.5); border-radius: 6px;
      background: transparent; color: #ffaaaa; font-size: 13px; cursor: pointer;
    }
    .btn-selector-clear:hover { background: rgba(255,100,100,0.15); }
    .btn-selector-confirm {
      padding: 6px 16px; border: none; border-radius: 6px;
      background: var(--success-500, #22c55e); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
    }
    .btn-selector-confirm:hover:not(:disabled) { background: var(--success-600, #16a34a); }
    .btn-selector-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .selector-map { flex: 1; width: 100%; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class MapaSelectorComponent implements AfterViewInit, OnDestroy {
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
  private tempMarkers: L.Marker[] = [];
  private tempLine: L.Polyline | null = null;
  private tempPolygon: L.Polygon | null = null;
  private pointMarker: L.Marker | null = null;
  private drawingTempLine: L.Polyline | null = null;

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private initMap() {
    const mapEl = document.getElementById('selector-map');
    if (!mapEl) return;

    this.map = L.map('selector-map').setView(this.center, this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM', maxZoom: 19
    }).addTo(this.map);

    if (this.mode === 'polygon' && this.initialPolygon.length > 0) {
      this.points = [...this.initialPolygon];
      this.renderPolygon();
    }

    if (this.mode === 'point' && this.initialPoint) {
      this.selectedPoint = [...this.initialPoint];
      this.renderPoint();
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
      marker.bindTooltip(`${i + 1}`, { permanent: true, direction: 'top', className: 'point-tooltip' });
      this.tempMarkers.push(marker as any);
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
        className: 'custom-marker',
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
