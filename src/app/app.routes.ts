import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./components/productos/productos').then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ventas',
    loadComponent: () =>
      import('./components/ventas/ventas').then(m => m.VentasComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];