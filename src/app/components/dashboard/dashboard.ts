import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
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

  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

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
        this.generarGraficas(data);
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
        const dias = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return dias <= 30 && dias >= 0;
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

  generarGraficas(data: any[]) {
    const top10 = [...data].sort((a, b) => b.stock - a.stock).slice(0, 10);
    this.barChartData = {
      labels: top10.map(p => p.nombre),
      datasets: [{
        data: top10.map(p => p.stock),
        backgroundColor: '#2a9d8f',
        borderRadius: 6
      }]
    };

    const categorias: any = {};
    data.forEach(p => {
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
    });

    this.pieChartData = {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ['#2a9d8f','#264653','#f4a261','#e63946','#e9c46a','#2196f3','#8ecae6']
      }]
    };
  }

  irProductos() { this.router.navigate(['/productos']); }
  irVentas() { this.router.navigate(['/ventas']); }
  logout() { this.authService.logout(); }
}
