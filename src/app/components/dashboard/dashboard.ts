import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  productos: any[] = [];
  totalProductos = 0;
  stockBajo = 0;
  sobrestock = 0;
  rol: string = '';
  alertasVencimiento: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
  this.rol = localStorage.getItem('rol') || 'admin';
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  this.http.get<any[]>(`http://localhost:3000/productos?t=${Date.now()}`, { headers }).subscribe({
    next: (data) => {
      this.productos = [...data];
      this.totalProductos = data.length;
      this.stockBajo = data.filter(p => p.stock < 50).length;
      this.sobrestock = data.filter(p => p.stock > 1000).length;
      this.calcularAlertas(data);
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error:', err)
  });
}

  calcularAlertas(productos: any[]) {
    const hoy = new Date();
    this.alertasVencimiento = productos
      .filter(p => {
        const fechaVence = new Date(p.fechaCaducidad);
        const diasRestantes = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 30 && diasRestantes >= 0;
      })
      .map(p => {
        const fechaVence = new Date(p.fechaCaducidad);
        const diasRestantes = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...p,
          diasRestantes,
          nivel: diasRestantes <= 7 ? 'critico' : diasRestantes <= 15 ? 'urgente' : 'proximo'
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  irProductos() { this.router.navigate(['/productos']); }
  logout() { this.authService.logout(); }
  irVentas() { this.router.navigate(['/ventas']); }
}
