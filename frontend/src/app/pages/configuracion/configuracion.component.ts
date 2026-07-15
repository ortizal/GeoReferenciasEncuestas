import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService, Modulo, Permiso, RolPermisos } from '../../core/services/configuracion.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  modulos = signal<Modulo[]>([]);
  permisos = signal<Permiso[]>([]);
  roles = signal<RolPermisos[]>([]);
  rolSeleccionado = signal<RolPermisos | null>(null);
  permisosSeleccionados = signal<Set<number>>(new Set());
  guardando = signal(false);
  mensaje = signal('');
  mensajeTipo = signal<'success' | 'error'>('success');
  loading = signal(true);

  constructor(private configuracionService: ConfiguracionService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    this.configuracionService.listarModulos().subscribe({
      next: (r) => { if (r.exitoso) this.modulos.set(r.datos || []); }
    });
    this.configuracionService.listarPermisos().subscribe({
      next: (r) => { if (r.exitoso) this.permisos.set(r.datos || []); }
    });
    this.configuracionService.listarRoles().subscribe({
      next: (r) => {
        if (r.exitoso) this.roles.set(r.datos || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  seleccionarRol(rol: RolPermisos) {
    this.rolSeleccionado.set(rol);
    const ids = new Set(rol.permisos.map(p => p.idPermiso));
    this.permisosSeleccionados.set(ids);
    this.mensaje.set('');
  }

  togglePermiso(idPermiso: number) {
    this.permisosSeleccionados.update(current => {
      const next = new Set(current);
      if (next.has(idPermiso)) {
        next.delete(idPermiso);
      } else {
        next.add(idPermiso);
      }
      return next;
    });
  }

  toggleModuloPermisos(modulo: Modulo) {
    const moduloPermisos = this.permisos().filter(p => p.idModulo === modulo.idModulo);
    const todosSeleccionados = moduloPermisos.every(p => this.permisosSeleccionados().has(p.idPermiso));

    this.permisosSeleccionados.update(current => {
      const next = new Set(current);
      moduloPermisos.forEach(p => {
        if (todosSeleccionados) {
          next.delete(p.idPermiso);
        } else {
          next.add(p.idPermiso);
        }
      });
      return next;
    });
  }

  isModuloCompleto(modulo: Modulo): boolean {
    const moduloPermisos = this.permisos().filter(p => p.idModulo === modulo.idModulo);
    return moduloPermisos.length > 0 && moduloPermisos.every(p => this.permisosSeleccionados().has(p.idPermiso));
  }

  isModuloParcial(modulo: Modulo): boolean {
    const moduloPermisos = this.permisos().filter(p => p.idModulo === modulo.idModulo);
    const seleccionados = moduloPermisos.filter(p => this.permisosSeleccionados().has(p.idPermiso));
    return seleccionados.length > 0 && seleccionados.length < moduloPermisos.length;
  }

  getPermisosModulo(modulo: Modulo): Permiso[] {
    return this.permisos().filter(p => p.idModulo === modulo.idModulo);
  }

  getRolBadgeClass(nombre: string): string {
    switch (nombre) {
      case 'ADMINISTRADOR': return 'badge-admin';
      case 'SUPERVISOR': return 'badge-supervisor';
      case 'VISITADOR': return 'badge-visitador';
      default: return 'badge-default';
    }
  }

  guardar() {
    const rol = this.rolSeleccionado();
    if (!rol) return;

    this.guardando.set(true);
    this.mensaje.set('');

    const idsPermisos = Array.from(this.permisosSeleccionados());
    this.configuracionService.actualizarPermisosRol(rol.idRol, idsPermisos).subscribe({
      next: (r) => {
        this.guardando.set(false);
        if (r.exitoso) {
          this.mensaje.set('Permisos actualizados exitosamente');
          this.mensajeTipo.set('success');
          this.cargarDatos();
        } else {
          this.mensaje.set(r.mensaje || 'Error al actualizar permisos');
          this.mensajeTipo.set('error');
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensaje.set(err?.error?.mensaje || 'Error al conectar con el servidor');
        this.mensajeTipo.set('error');
      }
    });
  }
}
