import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, Grupo } from '../../core/models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GrupoService } from '../../core/services/grupo.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios y Grupos</h1>
          <p class="page-subtitle">Gestión de usuarios, grupos y permisos del sistema</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'usuarios'" (click)="activeTab.set('usuarios')">
          <i class="bi bi-people"></i> Usuarios
        </button>
        <button class="tab" [class.active]="activeTab() === 'grupos'" (click)="activeTab.set('grupos')">
          <i class="bi bi-collection"></i> Grupos
        </button>
      </div>

      <div *ngIf="activeTab() === 'usuarios'">
        <div class="toolbar">
          <input class="search-input" placeholder="Buscar usuario..." [(ngModel)]="busquedaUsuarios" (input)="loadUsuarios()" autocomplete="off">
          <button class="btn-primary-action" (click)="abrirFormularioUsuario()">
            <i class="bi bi-plus-lg"></i> Nuevo Usuario
          </button>
        </div>
        <div class="card-premium">
          <div class="card-premium-body no-padding">
            <div class="table-responsive">
              <table class="table-premium">
                <thead>
                  <tr>
                    <th class="sortable" (click)="toggleSort('username')">Usuario <i class="bi" [ngClass]="sortIcon('username')"></i></th>
                    <th class="sortable" (click)="toggleSort('nombre')">Nombre <i class="bi" [ngClass]="sortIcon('nombre')"></i></th>
                    <th class="sortable" (click)="toggleSort('email')">Email <i class="bi" [ngClass]="sortIcon('email')"></i></th>
                    <th>Roles</th>
                    <th>Grupos</th>
                    <th class="sortable" (click)="toggleSort('estado')">Estado <i class="bi" [ngClass]="sortIcon('estado')"></i></th>
                    <th class="sortable" (click)="toggleSort('ultimoAcceso')">Último Acceso <i class="bi" [ngClass]="sortIcon('ultimoAcceso')"></i></th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of usuariosSorted()">
                    <td><code class="cell-code">{{ u.username }}</code></td>
                    <td><span class="cell-primary">{{ u.nombre }} {{ u.apellido }}</span></td>
                    <td>{{ u.email }}</td>
                    <td>
                      <span class="badge-premium badge-primary" *ngFor="let r of u.roles">{{ r }}</span>
                    </td>
                    <td>
                      <span class="badge-premium badge-group" *ngFor="let g of getGrupoNames(u)">{{ g }}</span>
                      <span *ngIf="!u.grupos || u.grupos.length === 0" class="text-muted">-</span>
                    </td>
                    <td>
                      <span class="badge-premium"
                        [class.badge-success]="u.estado==='ACTIVO'"
                        [class.badge-danger]="u.estado==='BLOQUEADO'"
                        [class.badge-neutral]="u.estado==='INACTIVO'">
                        {{ u.estado }}
                      </span>
                    </td>
                    <td>{{ u.ultimoAcceso | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <div class="dropdown">
                        <button class="btn btn-sm btn-light border dropdown-toggle" type="button" (click)="toggleDropdown(u.idUsuario!)" title="Acciones">
                          <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdown() === u.idUsuario">
                          <li>
                            <button class="dropdown-item" (click)="editarUsuario(u); openDropdown.set(null)">
                              <i class="bi bi-pencil me-2"></i>Editar
                            </button>
                          </li>
                          <li *ngIf="isVisitador(u)">
                            <button class="dropdown-item" (click)="asignarGrupos(u); openDropdown.set(null)">
                              <i class="bi bi-diagram-3 me-2"></i>Asignar Grupo
                            </button>
                          </li>
                          <li *ngIf="u.estado==='ACTIVO'">
                            <hr class="dropdown-divider">
                          </li>
                          <li *ngIf="u.estado==='ACTIVO'">
                            <button class="dropdown-item text-warning" (click)="bloquear(u); openDropdown.set(null)">
                              <i class="bi bi-lock me-2"></i>Bloquear
                            </button>
                          </li>
                          <li *ngIf="u.estado==='BLOQUEADO'">
                            <hr class="dropdown-divider">
                          </li>
                          <li *ngIf="u.estado==='BLOQUEADO'">
                            <button class="dropdown-item text-success" (click)="desbloquear(u); openDropdown.set(null)">
                              <i class="bi bi-unlock me-2"></i>Desbloquear
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="usuarios().length === 0">
                    <td colspan="8" class="empty-state">No se encontraron usuarios</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="pagination" *ngIf="totalPagesUsuarios() > 1">
          <button class="page-btn" [disabled]="pageUsuarios() === 0" (click)="pageUsuarios.set(pageUsuarios() - 1); loadUsuarios()">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="page-info">{{ pageUsuarios() + 1 }} / {{ totalPagesUsuarios() }}</span>
          <button class="page-btn" [disabled]="pageUsuarios() >= totalPagesUsuarios() - 1" (click)="pageUsuarios.set(pageUsuarios() + 1); loadUsuarios()">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <div *ngIf="activeTab() === 'grupos'">
        <div class="toolbar">
          <input class="search-input" placeholder="Buscar grupo..." [(ngModel)]="busquedaGrupos" (input)="loadGrupos()" autocomplete="off">
          <button class="btn-primary-action" (click)="abrirFormularioGrupo()">
            <i class="bi bi-plus-lg"></i> Nuevo Grupo
          </button>
        </div>
        <div class="card-premium">
          <div class="card-premium-body no-padding">
            <div class="table-responsive">
              <table class="table-premium">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th class="sortable" (click)="toggleSort('nombre')">Nombre <i class="bi" [ngClass]="sortIcon('nombre')"></i></th>
                    <th class="sortable" (click)="toggleSort('descripcion')">Descripción <i class="bi" [ngClass]="sortIcon('descripcion')"></i></th>
                    <th class="sortable" (click)="toggleSort('maximoUsuarios')">Max. Usuarios <i class="bi" [ngClass]="sortIcon('maximoUsuarios')"></i></th>
                    <th class="sortable" (click)="toggleSort('usuariosAsignados')">Asignados <i class="bi" [ngClass]="sortIcon('usuariosAsignados')"></i></th>
                    <th class="sortable" (click)="toggleSort('activo')">Estado <i class="bi" [ngClass]="sortIcon('activo')"></i></th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of gruposSorted()">
                    <td><span class="color-dot" [style.background]="g.color"></span></td>
                    <td><span class="cell-primary"><i [class]="'bi ' + (g.icono || 'bi-people')"></i> {{ g.nombre }}</span></td>
                    <td>{{ g.descripcion || '-' }}</td>
                    <td>{{ g.maximoUsuarios || 'Ilimitado' }}</td>
                    <td>{{ g.usuariosAsignados || 0 }}</td>
                    <td>
                      <span class="badge-premium"
                        [class.badge-success]="g.activo"
                        [class.badge-neutral]="!g.activo">
                        {{ g.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button class="action-btn" (click)="editarGrupo(g)" title="Editar">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn danger" (click)="eliminarGrupo(g)" title="Eliminar">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="grupos().length === 0">
                    <td colspan="7" class="empty-state">No se encontraron grupos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showFormUsuario()" (click)="cerrarFormUsuario()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editandoUsuario() ? 'Editar' : 'Nuevo' }} Usuario</h4>
            <button class="modal-close" (click)="cerrarFormUsuario()"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="error-banner" *ngIf="errorMsg()">
              <i class="bi bi-exclamation-triangle-fill"></i> {{ errorMsg() }}
              <button class="error-close" (click)="errorMsg.set('')"><i class="bi bi-x"></i></button>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label>Username *</label>
                <input class="form-input" [(ngModel)]="usuarioForm.username" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Email *</label>
                <input class="form-input" type="email" [(ngModel)]="usuarioForm.email" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Nombre *</label>
                <input class="form-input" [(ngModel)]="usuarioForm.nombre" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Apellido *</label>
                <input class="form-input" [(ngModel)]="usuarioForm.apellido" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Teléfono</label>
                <input class="form-input" [(ngModel)]="usuarioForm.telefono" autocomplete="off">
              </div>
              <div class="form-field" *ngIf="!editandoUsuario()">
                <label>Contraseña *</label>
                <input class="form-input" type="password" [(ngModel)]="usuarioForm.password" autocomplete="new-password">
              </div>
              <div class="form-field full-width">
                <label>Activo</label>
                <select class="form-input" [(ngModel)]="usuarioForm.activo">
                  <option [ngValue]="true">Sí</option>
                  <option [ngValue]="false">No</option>
                </select>
              </div>
              <div class="form-field full-width">
                <label class="section-label">Rol</label>
                <select class="form-input" [(ngModel)]="selectedRole">
                  <option value="">-- Seleccionar rol --</option>
                  <option *ngFor="let r of availableRoles" [value]="r">{{ r }}</option>
                </select>
              </div>
              <div class="form-field full-width" *ngIf="hasVisitadorRole()">
                <label>Grupo de trabajo</label>
                <select class="form-input" [(ngModel)]="usuarioForm.grupoId">
                  <option [ngValue]="null">-- Sin grupo --</option>
                  <option *ngFor="let g of allGrupos()" [ngValue]="g.idGrupo">{{ g.nombre }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarFormUsuario()">Cancelar</button>
            <button class="btn-save" (click)="guardarUsuario()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showFormGrupo()" (click)="cerrarFormGrupo()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editandoGrupo() ? 'Editar' : 'Nuevo' }} Grupo</h4>
            <button class="modal-close" (click)="cerrarFormGrupo()"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field">
                <label>Nombre *</label>
                <input class="form-input" [(ngModel)]="grupoForm.nombre" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Color</label>
                <div class="color-picker-row">
                  <input type="color" [(ngModel)]="grupoForm.color" class="color-input">
                  <input class="form-input" [(ngModel)]="grupoForm.color" placeholder="#6366f1" autocomplete="off">
                </div>
              </div>
              <div class="form-field full-width">
                <label>Descripción</label>
                <input class="form-input" [(ngModel)]="grupoForm.descripcion" autocomplete="off">
              </div>
              <div class="form-field">
                <label>Ícono</label>
                <select class="form-input" [(ngModel)]="grupoForm.icono">
                  <option value="bi-people">People</option>
                  <option value="bi-person-gear">Person Gear</option>
                  <option value="bi-shield-check">Shield</option>
                  <option value="bi-stars">Stars</option>
                  <option value="bi-geo-alt">Geo</option>
                  <option value="bi-building">Building</option>
                </select>
              </div>
              <div class="form-field">
                <label>Máx. Usuarios</label>
                <input class="form-input" type="number" [(ngModel)]="grupoForm.maximoUsuarios" placeholder="Sin límite" autocomplete="off">
              </div>
              <div class="form-field full-width">
                <label>Activo</label>
                <select class="form-input" [(ngModel)]="grupoForm.activo">
                  <option [ngValue]="true">Sí</option>
                  <option [ngValue]="false">No</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarFormGrupo()">Cancelar</button>
            <button class="btn-save" (click)="guardarGrupo()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showAsignarGrupos()" (click)="cerrarAsignarGrupos()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Asignar Grupos - {{ usuarioGrupos()?.nombre }} {{ usuarioGrupos()?.apellido }}</h4>
            <button class="modal-close" (click)="cerrarAsignarGrupos()"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="grupos-list">
              <label class="grupo-check" *ngFor="let g of allGrupos()">
                <input type="checkbox" [checked]="isGrupoAssigned(g)" (change)="toggleGrupo(g)">
                <span class="color-dot-sm" [style.background]="g.color"></span>
                <span>{{ g.nombre }}</span>
              </label>
              <p *ngIf="allGrupos().length === 0" class="empty-state">No hay grupos disponibles</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarAsignarGrupos()">Cancelar</button>
            <button class="btn-save" (click)="guardarGruposUsuario()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
    .page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
    .tabs { display: flex; gap: var(--space-1); margin-bottom: var(--space-5); border-bottom: 2px solid var(--border-light); padding-bottom: 0; }
    .tab { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-5); border: none; background: none; color: var(--text-secondary); font-size: var(--text-sm); font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all var(--transition-fast); &:hover { color: var(--text-primary); } &.active { color: var(--primary-600); border-bottom-color: var(--primary-600); } }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .search-input { height: 40px; padding: 0 var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); width: 300px; outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); } }
    .btn-primary-action { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover { background: var(--primary-700); } }
    .card-premium { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }
    .card-premium-body { padding: 0; }
    .no-padding { padding: 0 !important; }
    .table-responsive { overflow: visible; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; thead th { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--neutral-50); border-bottom: 1px solid var(--border-default); white-space: nowrap; } tbody tr { transition: background var(--transition-fast); &:hover { background: var(--bg-hover); } &:not(:last-child) td { border-bottom: 1px solid var(--border-light); } } tbody td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); vertical-align: middle; } }
    .sortable { cursor: pointer; user-select: none; &:hover { color: var(--primary-600); } i { font-size: 0.625rem; margin-left: 2px; } }
    .cell-code { font-size: var(--text-xs); background: var(--neutral-100); padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-family: var(--font-mono); }
    .cell-primary { font-weight: 500; }
    .text-muted { color: var(--text-tertiary); font-size: var(--text-xs); }
    .badge-premium { display: inline-block; padding: 0.15em 0.5em; border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 500; white-space: nowrap; margin-right: 4px; }
    .badge-primary { background: var(--primary-50); color: var(--primary-700); }
    .badge-success { background: var(--success-50); color: var(--success-700); }
    .badge-danger { background: var(--danger-50); color: var(--danger-700); }
    .badge-neutral { background: var(--neutral-100); color: var(--text-secondary); }
    .badge-group { background: #ede9fe; color: #6d28d9; }
    .color-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-default); }
    .color-dot-sm { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid var(--border-default); margin-right: 6px; }
    .row-actions { display: flex; gap: var(--space-1); }
    .dropdown { position: relative; }
    .dropdown-toggle::after { display: none; }
    .dropdown-menu { position: absolute; right: 0; z-index: 1050; min-width: 160px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: var(--space-1) 0; margin-top: var(--space-1); }
    .dropdown-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); font-size: var(--text-sm); color: var(--text-primary); background: none; border: none; width: 100%; cursor: pointer; white-space: nowrap; &:hover { background: var(--bg-hover); } }
    .action-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } &.warning:hover { background: var(--warning-50); color: var(--warning-600); } &.success:hover { background: var(--success-50); color: var(--success-600); } &.danger:hover { background: var(--danger-50); color: var(--danger-600); } }
    .pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-3); margin-top: var(--space-4); }
    .page-btn { width: 36px; height: 36px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover:not(:disabled) { background: var(--bg-hover); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
    .page-info { font-size: var(--text-sm); color: var(--text-secondary); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-card { background: var(--bg-surface); border-radius: var(--radius-2xl); width: 90%; max-width: 540px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.2s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-light); h4 { margin: 0; font-size: var(--text-lg); font-weight: 600; } }
    .modal-close { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); &:hover { background: var(--bg-hover); } }
    .modal-body { padding: var(--space-6); max-height: 65vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-light); }
    .btn-cancel { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-save { padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md); background: var(--primary-600); color: #fff; font-size: var(--text-sm); font-weight: 500; cursor: pointer; &:hover:not(:disabled) { background: var(--primary-700); } &:disabled { opacity: 0.6; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); label { font-size: var(--text-sm); font-weight: 500; } &.full-width { grid-column: 1 / -1; } }
    .form-input { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-primary); background: var(--bg-surface); outline: none; font-family: var(--font-sans); &:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); } }
    .color-picker-row { display: flex; gap: var(--space-2); align-items: center; }
    .color-input { width: 40px; height: 40px; padding: 2px; border: 1px solid var(--border-default); border-radius: var(--radius-md); cursor: pointer; }
    .grupos-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .grupo-check { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 1px solid var(--border-light); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } input[type="checkbox"] { width: 16px; height: 16px; } }
    .section-label { font-weight: 600; color: var(--text-primary); }
    .error-banner { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--danger-50); color: var(--danger-700); border: 1px solid var(--danger-200); border-radius: var(--radius-md); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    .error-close { margin-left: auto; background: none; border: none; color: var(--danger-500); cursor: pointer; padding: 2px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsuariosComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  grupos = signal<Grupo[]>([]);
  allGrupos = signal<Grupo[]>([]);
  activeTab = signal<'usuarios' | 'grupos'>('usuarios');
  showFormUsuario = signal(false);
  showFormGrupo = signal(false);
  showAsignarGrupos = signal(false);
  editandoUsuario = signal(false);
  editandoGrupo = signal(false);
  saving = signal(false);
  errorMsg = signal('');
  pageUsuarios = signal(0);
  totalPagesUsuarios = signal(1);
  pageGrupos = signal(0);
  openDropdown = signal<number | null>(null);

  sortUsuariosField = signal('username');
  sortUsuariosDir = signal<'asc'|'desc'>('asc');
  sortGruposField = signal('nombre');
  sortGruposDir = signal<'asc'|'desc'>('asc');

  usuariosSorted = computed(() => {
    const data = [...this.usuarios()];
    const field = this.sortUsuariosField();
    const dir = this.sortUsuariosDir();
    return data.sort((a: any, b: any) => {
      let va = a[field] ?? '';
      let vb = b[field] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  gruposSorted = computed(() => {
    const data = [...this.grupos()];
    const field = this.sortGruposField();
    const dir = this.sortGruposDir();
    return data.sort((a: any, b: any) => {
      let va = a[field] ?? '';
      let vb = b[field] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  availableRoles = ['ADMINISTRADOR', 'SUPERVISOR', 'VISITADOR'];
  selectedRole = '';

  usuarioForm: any = {};
  grupoForm: any = {};
  usuarioSeleccionado: Usuario | null = null;
  usuarioGrupos = signal<Usuario | null>(null);
  gruposSeleccionados = new Set<number>();

  busquedaUsuarios = '';
  busquedaGrupos = '';

  private grupoMap = new Map<number, Grupo>();

  constructor(private http: HttpClient, private grupoService: GrupoService) {}

  ngOnInit() {
    this.loadUsuarios();
    this.loadGrupos();
    this.loadAllGrupos();
    document.addEventListener('click', (e) => {
      if (!(e.target as Element)?.closest('.dropdown')) {
        this.openDropdown.set(null);
      }
    });
  }

  loadUsuarios() {
    const params: any = {
      page: this.pageUsuarios(),
      size: 15
    };
    if (this.busquedaUsuarios) params.busqueda = this.busquedaUsuarios;

    this.http.get<any>(`${environment.apiUrl}/usuarios`, { params }).subscribe({
      next: (r) => {
        if (r.exitoso) {
          this.usuarios.set(r.datos?.content || []);
          this.totalPagesUsuarios.set(r.datos?.totalPages || 1);
        }
      }
    });
  }

  loadGrupos() {
    const params: any = { page: this.pageGrupos(), size: 20 };
    if (this.busquedaGrupos) params.busqueda = this.busquedaGrupos;
    this.grupoService.buscar(this.busquedaGrupos, this.pageGrupos(), 20).subscribe({
      next: (r) => {
        if (r.exitoso) this.grupos.set(r.datos?.content || []);
      }
    });
  }

  loadAllGrupos() {
    this.grupoService.listarTodos(0, 100).subscribe({
      next: (r) => {
        if (r.exitoso) {
          const list = r.datos?.content || [];
          this.allGrupos.set(list);
          this.grupoMap.clear();
          list.forEach(g => { if (g.idGrupo) this.grupoMap.set(g.idGrupo, g); });
        }
      }
    });
  }

  getGrupoNames(u: Usuario): string[] {
    if (!u.grupos || u.grupos.length === 0) return [];
    return u.grupos.map(id => this.grupoMap.get(id)?.nombre || `#${id}`);
  }

  toggleDropdown(idUsuario: number) {
    this.openDropdown.set(this.openDropdown() === idUsuario ? null : idUsuario);
  }

  toggleSort(field: string) {
    if (this.activeTab() === 'usuarios') {
      if (this.sortUsuariosField() === field) {
        this.sortUsuariosDir.update(d => d === 'asc' ? 'desc' : 'asc');
      } else {
        this.sortUsuariosField.set(field);
        this.sortUsuariosDir.set('asc');
      }
    } else {
      if (this.sortGruposField() === field) {
        this.sortGruposDir.update(d => d === 'asc' ? 'desc' : 'asc');
      } else {
        this.sortGruposField.set(field);
        this.sortGruposDir.set('asc');
      }
    }
  }

  sortIcon(field: string): string {
    const activeField = this.activeTab() === 'usuarios' ? this.sortUsuariosField() : this.sortGruposField();
    const activeDir = this.activeTab() === 'usuarios' ? this.sortUsuariosDir() : this.sortGruposDir();
    if (activeField !== field) return 'bi-arrow-down-up';
    return activeDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  isVisitador(u: Usuario): boolean {
    return u.roles?.some(r => r === 'VISITADOR') ?? false;
  }

  abrirFormularioUsuario(u?: Usuario) {
    if (u) {
      this.editandoUsuario.set(true);
      this.usuarioSeleccionado = u;
      this.selectedRole = (u.roles && u.roles.length > 0) ? u.roles[0] : '';
      const firstGrupo = (u.grupos && u.grupos.length > 0) ? u.grupos[0] : null;
      this.usuarioForm = { ...u, password: '', grupoId: firstGrupo };
    } else {
      this.editandoUsuario.set(false);
      this.usuarioSeleccionado = null;
      this.selectedRole = '';
      this.usuarioForm = { activo: true, password: '', grupoId: null };
    }
    this.showFormUsuario.set(true);
  }

  cerrarFormUsuario() { this.showFormUsuario.set(false); this.usuarioForm = {}; this.selectedRole = ''; this.errorMsg.set(''); }
  editarUsuario(u: Usuario) { this.abrirFormularioUsuario(u); }

  hasVisitadorRole(): boolean { return this.selectedRole === 'VISITADOR'; }

  guardarUsuario() {
    this.saving.set(true);
    this.errorMsg.set('');
    const roles = this.selectedRole ? [this.selectedRole] : [];
    const grupos = this.usuarioForm.grupoId ? [this.usuarioForm.grupoId] : [];
    const dto: any = { ...this.usuarioForm, roles, grupos };
    delete dto.grupoId;
    if (this.editandoUsuario() && this.usuarioSeleccionado) {
      this.http.put<any>(`${environment.apiUrl}/usuarios/${this.usuarioSeleccionado.idUsuario}`, dto).subscribe({
        next: (r) => {
          this.saving.set(false);
          if (r.exitoso) { this.cerrarFormUsuario(); this.loadUsuarios(); }
          else { this.errorMsg.set(r.mensaje || 'Error al actualizar usuario'); }
        },
        error: (e) => { this.saving.set(false); this.errorMsg.set(e.error?.mensaje || 'Error al conectar con el servidor'); }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/usuarios`, dto).subscribe({
        next: (r) => {
          this.saving.set(false);
          if (r.exitoso) { this.cerrarFormUsuario(); this.loadUsuarios(); }
          else { this.errorMsg.set(r.mensaje || 'Error al crear usuario'); }
        },
        error: (e) => { this.saving.set(false); this.errorMsg.set(e.error?.mensaje || 'Error al conectar con el servidor'); }
      });
    }
  }

  bloquear(u: Usuario) {
    if (confirm(`¿Bloquear usuario ${u.username}?`)) {
      this.http.put<any>(`${environment.apiUrl}/usuarios/${u.idUsuario}/bloquear`, {}).subscribe({
        next: () => this.loadUsuarios()
      });
    }
  }

  desbloquear(u: Usuario) {
    if (confirm(`¿Desbloquear usuario ${u.username}?`)) {
      this.http.put<any>(`${environment.apiUrl}/usuarios/${u.idUsuario}/desbloquear`, {}).subscribe({
        next: () => this.loadUsuarios()
      });
    }
  }

  abrirFormularioGrupo(g?: Grupo) {
    if (g) {
      this.editandoGrupo.set(true);
      this.grupoForm = { ...g };
    } else {
      this.editandoGrupo.set(false);
      this.grupoForm = { color: '#6366f1', icono: 'bi-people', activo: true };
    }
    this.showFormGrupo.set(true);
  }

  cerrarFormGrupo() { this.showFormGrupo.set(false); this.grupoForm = {}; }
  editarGrupo(g: Grupo) { this.abrirFormularioGrupo(g); }

  guardarGrupo() {
    this.saving.set(true);
    if (this.editandoGrupo() && this.grupoForm.idGrupo) {
      this.grupoService.actualizar(this.grupoForm.idGrupo, this.grupoForm).subscribe({
        next: () => { this.saving.set(false); this.cerrarFormGrupo(); this.loadGrupos(); this.loadAllGrupos(); },
        error: () => { this.saving.set(false); }
      });
    } else {
      this.grupoService.crear(this.grupoForm).subscribe({
        next: () => { this.saving.set(false); this.cerrarFormGrupo(); this.loadGrupos(); this.loadAllGrupos(); },
        error: () => { this.saving.set(false); }
      });
    }
  }

  eliminarGrupo(g: Grupo) {
    if (confirm(`¿Eliminar grupo ${g.nombre}?`)) {
      this.grupoService.eliminar(g.idGrupo!).subscribe({
        next: () => { this.loadGrupos(); this.loadAllGrupos(); }
      });
    }
  }

  asignarGrupos(u: Usuario) {
    this.usuarioGrupos.set(u);
    this.gruposSeleccionados = new Set(u.grupos || []);
    this.showAsignarGrupos.set(true);
  }

  cerrarAsignarGrupos() { this.showAsignarGrupos.set(false); }

  isGrupoAssigned(g: Grupo): boolean {
    return g.idGrupo ? this.gruposSeleccionados.has(g.idGrupo) : false;
  }

  toggleGrupo(g: Grupo) {
    if (!g.idGrupo) return;
    if (this.gruposSeleccionados.has(g.idGrupo)) {
      this.gruposSeleccionados.delete(g.idGrupo);
    } else {
      this.gruposSeleccionados.add(g.idGrupo);
    }
  }

  guardarGruposUsuario() {
    const u = this.usuarioGrupos();
    if (!u) return;
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/usuarios/${u.idUsuario}/grupos`, Array.from(this.gruposSeleccionados)).subscribe({
      next: () => { this.saving.set(false); this.cerrarAsignarGrupos(); this.loadUsuarios(); this.loadAllGrupos(); },
      error: () => { this.saving.set(false); }
    });
  }
}
