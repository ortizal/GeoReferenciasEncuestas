import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManzanaService } from '../../core/services/manzana.service';
import { Manzana } from '../../core/models/models';

@Component({
  selector: 'app-manzanas',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  abrirImportar() { this.archivoSeleccionado.set(false); this.archivoNombre.set(''); this.resultadoImportacion.set(''); this.showImportar.set(true); }
  cerrarImportar() { this.showImportar.set(false); }
  onFileSelected(event: Event) { const input = event.target as HTMLInputElement; if (input.files && input.files.length > 0) { this.archivoFile = input.files[0]; this.archivoNombre.set(input.files[0].name); this.archivoSeleccionado.set(true); } }
  importarExcel() { if (!this.archivoFile) return; this.importando.set(true); this.manzanaService.importarExcel(this.archivoFile).subscribe({ next: (r) => { this.importando.set(false); this.resultadoImportacion.set(r.mensaje || 'Importación completada'); this.archivoSeleccionado.set(false); this.buscar(); }, error: () => { this.importando.set(false); this.resultadoImportacion.set('Error al importar'); } }); }

  descargarPlantilla() { this.manzanaService.descargarPlantilla().subscribe({ next: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'plantilla_manzanas.xlsx'; a.click(); window.URL.revokeObjectURL(url); }, error: () => alert('Error al descargar la plantilla. Verifique que el backend esté corriendo.') }); }

  exportarExcel() { window.open(`/api/manzanas/exportar/excel?busqueda=${this.busqueda}`, '_blank'); }
  exportarPDF() { window.open(`/api/manzanas/exportar/pdf?busqueda=${this.busqueda}`, '_blank'); }
}
