import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ProductosComponent } from './components/productos/productos';
import { VentasComponent } from './components/ventas/ventas';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'ventas', component: VentasComponent, canActivate: [authGuard] },
];