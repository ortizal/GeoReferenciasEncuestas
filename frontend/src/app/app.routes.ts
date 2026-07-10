import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'manzanas',
        loadComponent: () => import('./pages/manzanas/manzanas.component').then(m => m.ManzanasComponent)
      },
      {
        path: 'predios',
        loadComponent: () => import('./pages/predios/predios.component').then(m => m.PrediosComponent)
      },
      {
        path: 'visitas',
        loadComponent: () => import('./pages/visitas/visitas.component').then(m => m.VisitasComponent)
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
