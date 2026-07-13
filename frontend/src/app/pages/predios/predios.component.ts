import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredioService } from '../../core/services/predio.service';
import { ManzanaService } from '../../core/services/manzana.service';
import { Predio, Manzana } from '../../core/models/models';
import { MapaSelectorComponent } from '../../shared/components/mapa-selector/mapa-selector.component';

@Component({
  selector: 'app-predios',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaSelectorComponent],
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
  initialPoint: [number, number] | null = null;

  constructor(private predioService: PredioService, private manzanaService: ManzanaService) {}
  ngOnInit() { this.loadManzanas(); this.buscar(); }

  loadManzanas() { this.manzanaService.listarTodas().subscribe({ next: (r) => { if (r.exitoso) this.manzanas.set(r.datos || []); } }); }
  buscar() { this.predioService.buscar(this.busqueda).subscribe({ next: (r) => { if (r.exitoso) this.predios.set(r.datos?.content || []); } }); }
  abrirFormulario(p?: Predio) { if (p) { this.editando.set(true); this.predioSeleccionado = p; this.formData = { ...p }; } else { this.editando.set(false); this.predioSeleccionado = null; this.formData = {}; } this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; }
  editar(p: Predio) { this.abrirFormulario(p); }
  guardar() { this.saving.set(true); const op = this.editando() ? this.predioService.actualizar(this.predioSeleccionado!.idPredio!, this.formData) : this.predioService.crear(this.formData); op.subscribe({ next: () => { this.saving.set(false); this.cerrarFormulario(); this.buscar(); }, error: () => { this.saving.set(false); } }); }
  eliminar(p: Predio) { if (confirm(`¿Eliminar predio ${p.claveCatastral}?`)) this.predioService.eliminar(p.idPredio!).subscribe({ next: () => this.buscar() }); }
  getEstadoBadge(estado?: string): string { switch (estado) { case 'POSITIVO': return 'badge-success'; case 'NEGATIVO': return 'badge-danger'; case 'INDECISO': return 'badge-warning'; default: return 'badge-neutral'; } }

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.showImportar.set(true); }
  cerrarImportar() { this.showImportar.set(false); }
  onFileSelected(event: Event) { const input = event.target as HTMLInputElement; if (input.files && input.files.length > 0) { this.archivoFile = input.files[0]; this.archivoNombre.set(input.files[0].name); this.archivoSeleccionado.set(true); } }
  importarExcel() { if (!this.archivoFile) return; this.importando.set(true); this.predioService.importarExcel(this.archivoFile).subscribe({ next: (r) => { this.importando.set(false); this.resultadoImportacion.set(r.mensaje || 'Importación completada'); this.archivoSeleccionado.set(false); this.buscar(); }, error: () => { this.importando.set(false); this.resultadoImportacion.set('Error al importar'); } }); }

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
