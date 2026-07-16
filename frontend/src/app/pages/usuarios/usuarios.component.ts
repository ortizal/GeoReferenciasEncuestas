import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../core/models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><h1 class="page-title">Usuarios</h1><p class="page-subtitle">Gestión de usuarios del sistema</p></div>
        <div class="header-actions"><button class="btn-primary-action" (click)="abrirFormulario()"><i class="bi bi-plus-lg"></i> Nuevo Usuario</button></div>
      </div>
      <div class="card-premium">
        <div class="card-premium-body no-padding">
          <div class="table-responsive">
            <table class="table-premium">
              <thead><tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último Acceso</th><th>Acciones</th></tr></thead>
              <tbody>
                <tr *ngFor="let u of usuarios()">
                  <td><code class="cell-code">{{ u.username }}</code></td>
                  <td><span class="cell-primary">{{ u.nombre }} {{ u.apellido }}</span></td>
                  <td>{{ u.email }}</td>
                  <td><span class="badge-premium badge-primary" *ngFor="let r of u.roles">{{ r }}</span></td>
                  <td><span class="badge-premium" [class.badge-success]="u.estado==='ACTIVO'" [class.badge-danger]="u.estado==='BLOQUEADO'" [class.badge-neutral]="u.estado==='INACTIVO'">{{ u.estado }}</span></td>
                  <td>{{ u.ultimoAcceso | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><div class="row-actions"><button class="action-btn" (click)="editar(u)"><i class="bi bi-pencil"></i></button><button class="action-btn warning" (click)="bloquear(u)" *ngIf="u.estado==='ACTIVO'"><i class="bi bi-lock"></i></button><button class="action-btn success" (click)="desbloquear(u)" *ngIf="u.estado==='BLOQUEADO'"><i class="bi bi-unlock"></i></button></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-overlay" *ngIf="showForm()" (click)="cerrarFormulario()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h4>{{ editando() ? 'Editar' : 'Nuevo' }} Usuario</h4><button class="modal-close" (click)="cerrarFormulario()"><i class="bi bi-x"></i></button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field"><label>Username *</label><input class="form-input" [(ngModel)]="formData.username" autocomplete="off"></div>
              <div class="form-field"><label>Email *</label><input class="form-input" type="email" [(ngModel)]="formData.email" autocomplete="off"></div>
              <div class="form-field"><label>Nombre *</label><input class="form-input" [(ngModel)]="formData.nombre" autocomplete="off"></div>
              <div class="form-field"><label>Apellido *</label><input class="form-input" [(ngModel)]="formData.apellido" autocomplete="off"></div>
              <div class="form-field" *ngIf="!editando()"><label>Contraseña *</label><input class="form-input" type="password" [(ngModel)]="formData.password" autocomplete="new-password"></div>
              <div class="form-field"><label>Rol *</label><select class="form-input" [(ngModel)]="formData.rol"><option value="ADMINISTRADOR">Administrador</option><option value="SUPERVISOR">Supervisor</option><option value="VISITADOR">Visitador</option></select></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" (click)="cerrarFormulario()">Cancelar</button><button class="btn-save" (click)="guardar()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
    .header-actions { display: flex; gap: var(--space-2); }
    .btn-primary-action { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover { background: var(--primary-700); } }
    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .card-premium-body { padding: 0; }
    .no-padding { padding: 0 !important; }
    .table-responsive { overflow-x: auto; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; } tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } } tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; } }
    .cell-code { font-size: var(--text-xs); background: var(--neutral-100); padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-family: var(--font-mono); }
    .cell-primary { font-weight: 500; }
    .row-actions { display: flex; gap: var(--space-1); }
    .action-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } &.warning:hover { background: var(--warning-50); color: var(--warning-600); } &.success:hover { background: var(--success-50); color: var(--success-600); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 540px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); } }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-save { padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover:not(:disabled) { background: var(--primary-700); } &:disabled { opacity: 0.6; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: var(--text-sm); font-weight: 500; } }
    .form-input { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsuariosComponent implements OnInit {
  usuarios = signal<Usuario[]>([]); showForm = signal(false); editando = signal(false); saving = signal(false); formData: any = {}; usuarioSeleccionado: Usuario | null = null;
  constructor(private http: HttpClient) {}
  ngOnInit() { this.loadUsuarios(); }
  loadUsuarios() { this.http.get<any>(`${environment.apiUrl}/usuarios`).subscribe({ next: (r) => { if (r.exitoso) this.usuarios.set(r.datos?.content || []); } }); }
  abrirFormulario(u?: Usuario) { if (u) { this.editando.set(true); this.usuarioSeleccionado = u; this.formData = { ...u }; } else { this.editando.set(false); this.usuarioSeleccionado = null; this.formData = {}; } this.showForm.set(true); }
  cerrarFormulario() { this.showForm.set(false); this.formData = {}; }
  editar(u: Usuario) { this.abrirFormulario(u); }
  guardar() { this.saving.set(true); setTimeout(() => { this.saving.set(false); this.cerrarFormulario(); this.loadUsuarios(); }, 1000); }
  bloquear(u: Usuario) { if (confirm(`¿Bloquear usuario ${u.username}?`)) {} }
  desbloquear(u: Usuario) { if (confirm(`¿Desbloquear usuario ${u.username}?`)) {} }
}
