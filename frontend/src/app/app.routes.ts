import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';

export const routes: Routes = [
  // Ruta raíz: el guard decide a qué panel redirigir según el rol
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeRedirectGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  // Login (ruta pública)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  // ── EMPLEADO ──────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['EMPLEADO'] },
    loadComponent: () =>
      import('./pages/dashboard-empleado/dashboard-empleado.component').then(
        (m) => m.DashboardEmpleadoComponent
      ),
  },

  // ── RRHH ──────────────────────────────────────────────────────────────────
  {
    path: 'rrhh',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['RRHH'] },
    loadComponent: () =>
      import('./pages/panel-rrhh/panel-rrhh.component').then(
        (m) => m.PanelRrhhComponent
      ),
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/panel-admin/panel-admin.component').then(
        (m) => m.PanelAdminComponent
      ),
  },

  // Comodín: URLs desconocidas → redirige al panel del rol actual
  {
    path: '**',
    canActivate: [homeRedirectGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
];
