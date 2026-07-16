import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PredioService } from '../../core/services/predio.service';
import { ManzanaService } from '../../core/services/manzana.service';
import { WebSocketService, ImportProgress } from '../../core/services/websocket.service';
import { Predio, Manzana } from '../../core/models/models';
import { MapaSelectorComponent } from '../../shared/components/mapa-selector/mapa-selector.component';
import { MapModalComponent } from '../../shared/components/map-modal/map-modal.component';

@Component({
  selector: 'app-predios',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaSelectorComponent, MapModalComponent],
  templateUrl: './predios.component.html',
  styleUrl: './predios.component.css'
})
export class PrediosComponent implements OnInit {
  predios = signal<Predio[]>([]);
  manzanas = signal<Manzana[]>([]);
  showForm = signal(false);
  editando = signal(false);
  saving = signal(false);
  showImportar = signal(false);
  importando = signal(false);
  archivoSeleccionado = signal(false);
  archivoNombre = signal('');
  resultadoImportacion = signal('');
  busqueda = '';
  filtroManzana = '';
  formData: any = {};
  predioSeleccionado: Predio | null = null;
  archivoFile: File | null = null;
  showMapaSelector = signal(false);
  openRowMenu = signal<number | null>(null);
  initialPoint: [number, number] | null = null;
  formSections = signal({
    identificacion: true,
    propietario: false,
    caracteristicas: false,
    dimensiones: false,
    ubicacion: false,
    observaciones: false,
  });

  showMapModal = signal(false);
  mapModalData = signal<{ title: string; geoJSON: string | null; latitud: number | null; longitud: number | null; color: string; itemName: string }>({ title: '', geoJSON: null, latitud: null, longitud: null, color: '#adb5bd', itemName: '' });

  importProgress = signal<ImportProgress>({ sessionId: '', current: 0, total: 0, rowKey: '', rowStatus: '', imported: 0, updated: 0, duplicated: 0, errors: 0, notFound: 0, completed: false });
  importProgressPercent = signal(0);
  private unsubscribeProgress: (() => void) | null = null;

  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  tamanoPagina = 20;

  constructor(private predioService: PredioService, private manzanaService: ManzanaService, private router: Router, private wsService: WebSocketService) {}
  ngOnInit() { this.loadManzanas(); this.buscar(); }

  ngOnDestroy() {
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = null;
    }
  }

  loadManzanas() { this.manzanaService.listarTodas().subscribe({ next: (r) => { if (r.exitoso) this.manzanas.set(r.datos || []); } }); }
  buscar() {
    this.predioService.buscar(this.busqueda, true, this.paginaActual, this.tamanoPagina).subscribe({
      next: (r) => {
        if (r.exitoso && r.datos) {
          this.predios.set(r.datos.content || []);
          this.totalPaginas = r.datos.totalPages;
          this.totalRegistros = r.datos.totalElements;
          this.paginaActual = r.datos.number;
        }
      }
    });
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
  abrirFormulario(p?: Predio) { if (p) { this.editando.set(true); this.predioSeleccionado = p; this.formData = { ...p }; } else { this.editando.set(false); this.predioSeleccionado = null; this.formData = {}; } this.formSections.set({ identificacion: true, propietario: false, caracteristicas: false, dimensiones: false, ubicacion: false, observaciones: false }); this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; }
  toggleSection(key: string) { this.formSections.update(s => ({ ...s, [key]: !(s as any)[key] })); }
  toggleRowMenu(id: number) { this.openRowMenu.set(this.openRowMenu() === id ? null : id); }
  editar(p: Predio) { this.abrirFormulario(p); }
  verEnMapa(p: Predio) {
    const color = this.getEstadoColor(p.estadoVisita);
    this.mapModalData.set({
      title: p.claveCatastral || 'Predio',
      geoJSON: p.poligonoGeoJSON || null,
      latitud: p.latitud || null,
      longitud: p.longitud || null,
      color,
      itemName: p.propietario || p.claveCatastral || ''
    });
    this.showMapModal.set(true);
  }
  closeMapModal() { this.showMapModal.set(false); }
  getEstadoColor(estado?: string): string {
    switch (estado) { case 'POSITIVO': return '#22c55e'; case 'NEGATIVO': return '#ef4444'; case 'INDECISO': return '#f59e0b'; default: return '#adb5bd'; }
  }
  guardar() { this.saving.set(true); const op = this.editando() ? this.predioService.actualizar(this.predioSeleccionado!.idPredio!, this.formData) : this.predioService.crear(this.formData); op.subscribe({ next: () => { this.saving.set(false); this.cerrarFormulario(); this.buscar(); }, error: () => { this.saving.set(false); } }); }
  eliminar(p: Predio) { if (confirm(`¿Eliminar predio ${p.claveCatastral}?`)) this.predioService.eliminar(p.idPredio!).subscribe({ next: () => this.buscar() }); }
  getEstadoBadge(estado?: string): string { switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; default: return 'badge-neutral'; } }

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.importProgressPercent.set(0); this.showImportar.set(true); }
  cerrarImportar() { this.showImportar.set(false); if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; } }
  onFileSelected(event: Event) { const input = event.target as HTMLInputElement; if (input.files && input.files.length > 0) { this.archivoFile = input.files[0]; this.archivoNombre.set(input.files[0].name); this.archivoSeleccionado.set(true); } }
  importarExcel() {
    if (!this.archivoFile) return;
    this.importando.set(true);
    this.importProgressPercent.set(0);

    const sessionId = 'predios-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    this.unsubscribeProgress = this.wsService.subscribeToImportProgress(sessionId, (msg) => {
      this.importProgress.set(msg);
      if (msg.total > 0) {
        this.importProgressPercent.set(Math.round((msg.current / msg.total) * 100));
      }
      if (msg.completed) {
        this.importando.set(false);
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      }
    });

    this.predioService.importarExcel(this.archivoFile, sessionId).subscribe({
      next: (r) => {
        this.importando.set(false);
        this.resultadoImportacion.set(r.mensaje || 'Importación completada');
        this.archivoSeleccionado.set(false);
        this.buscar();
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      },
      error: () => {
        this.importando.set(false);
        this.resultadoImportacion.set('Error al importar');
        if (this.unsubscribeProgress) { this.unsubscribeProgress(); this.unsubscribeProgress = null; }
      }
    });
  }

  descargarPlantilla() { this.predioService.descargarPlantilla().subscribe({ next: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'plantilla_predios.xlsx'; a.click(); window.URL.revokeObjectURL(url); }, error: () => alert('Error al descargar la plantilla. Verifique que el backend esté corriendo.') }); }

  exportarExcel() { window.open(`/api/predios/exportar/excel?busqueda=${this.busqueda}`, '_blank'); }
  exportarPDF() { window.open(`/api/predios/exportar/pdf?busqueda=${this.busqueda}`, '_blank'); }

  abrirMapaSelector() {
    if (this.formData.latitud && this.formData.longitud) {
      this.initialPoint = [this.formData.latitud, this.formData.longitud];
    } else {
      this.initialPoint = null;
    }
    this.showMapaSelector.set(true);
  }

  onMapaSelectorConfirm(result: { point?: [number, number] }) {
    this.showMapaSelector.set(false);
    if (result.point) {
      this.formData.latitud = result.point[0];
      this.formData.longitud = result.point[1];
    }
  }

  onMapaSelectorCancel() {
    this.showMapaSelector.set(false);
  }
}
