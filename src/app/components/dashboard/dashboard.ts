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
  alertasVencimiento: any[] = [];
  rol: string = '';
  totalVentas = 0;
  analisis: any = null;
  rotacion: any[] = [];
  mostrarRotacion = false;
  ultimos7Dias: any[] = [];

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
        this.stockBajo = data.filter(p => p.stock < (p.stockMinimo || 50)).length;
        this.sobrestock = data.filter(p => p.stock > (p.stockMaximo || 1000)).length;
        this.calcularAlertas(data);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error productos:', err)
    });

    this.http.get<any[]>(`http://localhost:3000/ventas?t=${Date.now()}`, { headers }).subscribe({
      next: (ventas) => {
        this.totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
        this.generarGraficaVentas(ventas);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error ventas:', err)
    });

    this.http.get<any>(`http://localhost:3000/productos/analisis?t=${Date.now()}`, { headers }).subscribe({
      next: (data) => {
        this.analisis = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error analisis:', err)
    });

    this.http.get<any[]>(`http://localhost:3000/productos/rotacion?t=${Date.now()}`, { headers }).subscribe({
      next: (data) => {
        this.rotacion = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error rotacion:', err)
    });
  }

  calcularAlertas(productos: any[]) {
    const hoy = new Date();
    this.alertasVencimiento = productos
      .filter(p => {
        const fechaVence = new Date(p.fechaCaducidad);
        const dias = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return dias <= 30 && dias >= 0;
      })
      .map(p => {
        const fechaVence = new Date(p.fechaCaducidad);
        const diasRestantes = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...p, diasRestantes,
          nivel: diasRestantes <= 7 ? 'critico' : diasRestantes <= 15 ? 'urgente' : 'proximo'
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  generarGraficaVentas(ventas: any[]) {
    const hoy = new Date();
    const ultimos7: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      labels.push(fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }));
      const totalDia = ventas
        .filter(v => v.fecha.startsWith(fechaStr))
        .reduce((sum, v) => sum + parseFloat(v.total), 0);
      ultimos7.push(totalDia);
    }
    const maxVal = Math.max(...ultimos7, 1);
    this.ultimos7Dias = labels.map((label, i) => ({
      label,
      total: ultimos7[i].toFixed(2),
      porcentaje: Math.round((ultimos7[i] / maxVal) * 100)
    }));
  }

  sumarNumeros(sum: number, dia: any): number {
    return sum + (parseFloat(dia.total) || 0);
  }

  irProductos() { this.router.navigate(['/productos']); }
  irVentas() { this.router.navigate(['/ventas']); }
  logout() { this.authService.logout(); }
}
