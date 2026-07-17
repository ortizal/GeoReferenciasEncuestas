import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ManzanaService } from '../../core/services/manzana.service';
import { PredioService } from '../../core/services/predio.service';
import { VisitaService } from '../../core/services/visita.service';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService, ImportProgress } from '../../core/services/websocket.service';
import { Manzana, Predio } from '../../core/models/models';
import { MapaSelectorComponent } from '../../shared/components/mapa-selector/mapa-selector.component';
import { MapModalComponent } from '../../shared/components/map-modal/map-modal.component';

@Component({
  selector: 'app-manzanas',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaSelectorComponent, MapModalComponent],
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
  openRowMenu = signal<number | null>(null);
  initialPolygon: [number, number][] = [];

  showMapModal = signal(false);
  mapModalData = signal<{ title: string; geoJSON: string | null; color: string; itemName: string }>({ title: '', geoJSON: null, color: '#2b4d2b', itemName: '' });
  manzanaModalPredios = signal<Predio[]>([]);
  manzanaModalManzana = signal<Manzana | null>(null);

  showVisitaForm = signal(false);
  visitaFormPredio: Predio | null = null;
  visitaFormData: any = { estadoVisita: '', observaciones: '' };
  visitaSaving = signal(false);
  visitaMensaje = signal('');

  previewData: any = null;
  previewLoading = signal(false);
  previewError = signal('');
  importResult: any = null;
  importProgress = signal<ImportProgress>({ sessionId: '', current: 0, total: 0, rowKey: '', rowStatus: '', imported: 0, updated: 0, duplicated: 0, errors: 0, notFound: 0, autoCreated: 0, completed: false });
  importProgressPercent = signal(0);
  rowStatusMap = signal<Map<string, string>>(new Map());
  private unsubscribeProgress: (() => void) | null = null;

  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  tamanoPagina = 20;
  sortField = signal('nombre');
  sortDir = signal<'asc'|'desc'>('asc');

  constructor(
    private manzanaService: ManzanaService,
    private predioService: PredioService,
    private visitaService: VisitaService,
    private authService: AuthService,
    private router: Router,
    private wsService: WebSocketService
  ) {}
  ngOnInit() { this.buscar(); }

  ngOnDestroy() {
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = null;
    }
  }

  buscar() {
    this.manzanaService.buscar(this.busqueda, this.filtroActivo, this.paginaActual, this.tamanoPagina, this.sortField(), this.sortDir()).subscribe({
      next: (r) => {
        if (r.exitoso && r.datos) {
          this.manzanas.set(r.datos.content || []);
          this.totalPaginas = r.datos.totalPages;
          this.totalRegistros = r.datos.totalElements;
          this.paginaActual = r.datos.number;
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
    this.paginaActual = 0;
    this.buscar();
  }

  sortIcon(field: string): string {
    if (this.sortField() !== field) return 'bi-arrow-down-up';
    return this.sortDir() === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }
  irAPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas) return;
    this.paginaActual = pagina;
    this.buscar();
  }
  paginasNumeradas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(0, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 3);
    for (let i = inicio; i < fin; i++) paginas.push(i);
    return paginas;
  }
  abrirFormulario(m?: Manzana) { if (m) { this.editando.set(true); this.manzanaSeleccionada = m; this.formData = { ...m }; } else { this.editando.set(false); this.manzanaSeleccionada = null; this.formData = {}; } this.errorMessage.set(''); this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; this.errorMessage.set(''); }
  toggleRowMenu(id: number) { this.openRowMenu.set(this.openRowMenu() === id ? null : id); }
  editar(m: Manzana) { this.abrirFormulario(m); }
  verEnMapa(m: Manzana) {
    this.manzanaModalManzana.set(m);
    this.mapModalData.set({ title: m.nombre || 'Manzana', geoJSON: m.poligonoGeoJSON || null, color: '#2b4d2b', itemName: m.claveCatastralManzana || '' });
    this.manzanaModalPredios.set([]);
    this.showMapModal.set(true);

    if (m.idManzana) {
      this.predioService.listarPorManzana(m.idManzana).subscribe({
        next: (r) => {
          if (r.exitoso && r.datos) {
            this.manzanaModalPredios.set(r.datos);
          }
        }
      });
    }
  }
  closeMapModal() { this.showMapModal.set(false); }

  onCrearVisitaDesdeMapa(predio: Predio) {
    this.visitaFormPredio = predio;
    this.visitaFormData = { estadoVisita: '', observaciones: '' };
    this.visitaMensaje.set('');
    this.showVisitaForm.set(true);
  }

  cerrarVisitaForm() {
    this.showVisitaForm.set(false);
    this.visitaFormPredio = null;
    this.visitaMensaje.set('');
  }

  guardarVisita() {
    if (!this.visitaFormPredio || !this.visitaFormData.estadoVisita) {
      this.visitaMensaje.set('Seleccione un estado para la visita.');
      return;
    }

    this.visitaSaving.set(true);
    this.visitaMensaje.set('');

    const user = this.authService.getCurrentUser();
    const visita: any = {
      idPredio: this.visitaFormPredio.idPredio,
      fechaVisita: new Date().toISOString(),
      estadoVisita: this.visitaFormData.estadoVisita,
      observaciones: this.visitaFormData.observaciones || '',
      idUsuarioVisitador: user?.idUsuario || null,
      nombreVisitador: user ? `${user.nombre} ${user.apellido}` : ''
    };

    this.visitaService.crear(visita).subscribe({
      next: (r) => {
        this.visitaSaving.set(false);
        if (r.exitoso) {
          this.visitaMensaje.set('Visita registrada exitosamente.');
          if (this.visitaFormPredio?.idPredio) {
            this.visitaFormPredio = { ...this.visitaFormPredio, estadoVisita: this.visitaFormData.estadoVisita };
            const predios = this.manzanaModalPredios().map(p =>
              p.idPredio === this.visitaFormPredio?.idPredio
                ? { ...p, estadoVisita: this.visitaFormData.estadoVisita }
                : p
            );
            this.manzanaModalPredios.set(predios);
          }
          setTimeout(() => this.cerrarVisitaForm(), 1500);
        } else {
          this.visitaMensaje.set(r.mensaje || 'Error al crear la visita.');
        }
      },
      error: (err: any) => {
        this.visitaSaving.set(false);
        this.visitaMensaje.set(err?.error?.mensaje || 'Error al conectar con el servidor.');
      }
    });
  }
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

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.previewData = null; this.importResult = null; this.previewError.set(''); this.rowStatusMap.set(new Map()); this.importProgressPercent.set(0); this.showImportar.set(true); }
  cerrarImportar() { this.showImportar.set(false); this.previewData = null; this.importResult = null; if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; } }

  getRowStatus(clave: string): string | undefined {
    if (!clave) return undefined;
    return this.rowStatusMap().get(clave);
  }
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
    this.importProgressPercent.set(0);
    this.rowStatusMap.set(new Map());

    const sessionId = 'manzanas-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

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
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      }
    });

    this.manzanaService.importarExcel(this.archivoFile, sessionId).subscribe({
      next: (r) => {
        this.importando.set(false);
        if (r.exitoso) {
          this.importResult = r.datos;
          this.resultadoImportacion.set(r.mensaje || 'Importación completada');
          this.buscar();
        } else {
          this.previewError.set(r.mensaje || 'Error al importar');
        }
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      },
      error: () => {
        this.importando.set(false);
        this.previewError.set('Error al importar');
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
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

    let rings: number[][][] = [];

    if (source.type === 'MultiPolygon') {
      rings = source.coordinates.map((polygon: number[][][]) => polygon[0]);
    } else if (source.type === 'Polygon') {
      rings = [source.coordinates[0]];
    } else {
      return [];
    }

    const allPoints: [number, number][] = [];
    for (const ring of rings) {
      for (const point of ring) {
        const [x, y] = point;
        if (typeof x !== 'number' || typeof y !== 'number') continue;

        if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
          allPoints.push([y, x]);
        } else {
          const projected = this.utmToLatLng(x, y, 17, 'N');
          allPoints.push([projected.lat, projected.lng]);
        }
      }
    }
    return allPoints.filter((p: [number, number]) => p[0] !== 0 || p[1] !== 0);
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
