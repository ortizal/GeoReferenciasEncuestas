import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManzanaService } from '../../core/services/manzana.service';
import { Manzana } from '../../core/models/models';
import { MapaSelectorComponent } from '../../shared/components/mapa-selector/mapa-selector.component';

@Component({
  selector: 'app-manzanas',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaSelectorComponent],
  templateUrl: './manzanas.component.html',
  styleUrl: './manzanas.component.css'
})
export class ManzanasComponent implements OnInit {
  manzanas = signal<Manzana[]>([]);
  showForm = signal(false);
  editando = signal(false);
  saving = signal(false);
  showImportar = signal(false);
  importando = signal(false);
  archivoSeleccionado = signal(false);
  archivoNombre = signal('');
  resultadoImportacion = signal('');
  errorMessage = signal('');
  busqueda = '';
  filtroActivo = true;
  formData: any = {};
  manzanaSeleccionada: Manzana | null = null;
  archivoFile: File | null = null;
  showMapaSelector = signal(false);
  initialPolygon: [number, number][] = [];

  previewData: any = null;
  previewLoading = signal(false);
  previewError = signal('');
  importResult: any = null;

  constructor(private manzanaService: ManzanaService) {}
  ngOnInit() { this.buscar(); }

  buscar() { this.manzanaService.buscar(this.busqueda, this.filtroActivo).subscribe({ next: (r) => { if (r.exitoso) this.manzanas.set(r.datos?.content || []); } }); }
  abrirFormulario(m?: Manzana) { if (m) { this.editando.set(true); this.manzanaSeleccionada = m; this.formData = { ...m }; } else { this.editando.set(false); this.manzanaSeleccionada = null; this.formData = {}; } this.errorMessage.set(''); this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; this.errorMessage.set(''); }
  editar(m: Manzana) { this.abrirFormulario(m); }
  guardar() {
    const clave = this.formData.claveCatastralManzana?.toString().trim();
    const nombre = this.formData.nombre?.toString().trim();

    if (!clave || !nombre) {
      this.errorMessage.set('La clave catastral y el nombre son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const payload = {
      ...this.formData,
      claveCatastralManzana: clave,
      nombre
    };
    if (typeof payload.poligonoGeoJSON === 'string' && payload.poligonoGeoJSON.trim() === '') {
      delete payload.poligonoGeoJSON;
    }

    const op = this.editando()
      ? this.manzanaService.actualizar(this.manzanaSeleccionada!.idManzana!, payload)
      : this.manzanaService.crear(payload);

    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.cerrarFormulario();
        this.buscar();
      },
      error: (err: any) => {
        this.saving.set(false);
        const mensaje = err?.error?.mensaje || err?.error?.error || 'No se pudo guardar la manzana.';
        this.errorMessage.set(mensaje);
      }
    });
  }
  eliminar(m: Manzana) { if (confirm(`¿Eliminar manzana ${m.nombre}?`)) this.manzanaService.eliminar(m.idManzana!).subscribe({ next: () => this.buscar() }); }

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.previewData = null; this.importResult = null; this.previewError.set(''); this.showImportar.set(true); }
  cerrarImportar() { this.showImportar.set(false); this.previewData = null; this.importResult = null; }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoFile = input.files[0];
      this.archivoNombre.set(input.files[0].name);
      this.archivoSeleccionado.set(true);
      this.previewData = null;
      this.importResult = null;
      this.previewError.set('');
      this.cargarPreview();
    }
  }

  cargarPreview() {
    if (!this.archivoFile) return;
    this.previewLoading.set(true);
    this.previewError.set('');
    this.manzanaService.previewExcel(this.archivoFile).subscribe({
      next: (r) => {
        this.previewLoading.set(false);
        if (r.exitoso) {
          this.previewData = r.datos;
        } else {
          this.previewError.set(r.mensaje || 'Error al leer el archivo');
        }
      },
      error: () => {
        this.previewLoading.set(false);
        this.previewError.set('Error al conectar con el servidor');
      }
    });
  }

  importarExcel() {
    if (!this.archivoFile) return;
    this.importando.set(true);
    this.manzanaService.importarExcel(this.archivoFile).subscribe({
      next: (r) => {
        this.importando.set(false);
        if (r.exitoso) {
          this.importResult = r.datos;
          this.resultadoImportacion.set(r.mensaje || 'Importación completada');
          this.buscar();
        } else {
          this.previewError.set(r.mensaje || 'Error al importar');
        }
      },
      error: () => {
        this.importando.set(false);
        this.previewError.set('Error al importar');
      }
    });
  }

  descargarPlantilla() { this.manzanaService.descargarPlantilla().subscribe({ next: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'plantilla_manzanas.xlsx'; a.click(); window.URL.revokeObjectURL(url); }, error: () => alert('Error al descargar la plantilla. Verifique que el backend esté corriendo.') }); }

  exportarExcel() { window.open(`/api/manzanas/exportar/excel?busqueda=${this.busqueda}`, '_blank'); }
  exportarPDF() { window.open(`/api/manzanas/exportar/pdf?busqueda=${this.busqueda}`, '_blank'); }

  abrirMapaSelector() {
    if (this.formData.poligonoGeoJSON && this.formData.poligonoGeoJSON.trim()) {
      try {
        const geo = JSON.parse(this.formData.poligonoGeoJSON);
        this.initialPolygon = this.extractCoordinatesFromGeoJSON(geo);
      } catch {
        this.initialPolygon = [];
      }
    } else {
      this.initialPolygon = [];
    }
    this.showMapaSelector.set(true);
  }

  private extractCoordinatesFromGeoJSON(geo: any): [number, number][] {
    const source = geo?.type === 'FeatureCollection' ? geo.features?.[0]?.geometry : geo;
    if (!source || !source.coordinates) return [];

    const ring = source.type === 'MultiPolygon'
      ? source.coordinates?.[0]?.[0]
      : source.coordinates?.[0];

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

    return { lat: lat * 180 / Math.PI, lng: lng * 180 / Math.PI };
  }

  onMapaSelectorConfirm(result: { polygon?: [number, number][]; geoJSON?: any }) {
    this.showMapaSelector.set(false);
    if (result.geoJSON) {
      this.formData.poligonoGeoJSON = JSON.stringify(result.geoJSON);
    }
  }

  onMapaSelectorCancel() {
    this.showMapaSelector.set(false);
  }
}
