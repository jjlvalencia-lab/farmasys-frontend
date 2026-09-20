import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/landing/landing').then(m => m.LandingComponent)
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
    path: 'pedidos',
    loadComponent: () =>
      import('./components/pedidos/pedidos').then(m => m.PedidosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'motoristas',
    loadComponent: () =>
      import('./components/motoristas/motoristas').then(m => m.MotoristasComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
