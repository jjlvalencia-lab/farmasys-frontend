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

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>('http://localhost:3000/productos', { headers }).subscribe({
      next: (data) => {
        this.productos = [...data];
        this.totalProductos = data.length;
        this.stockBajo = data.filter(p => p.stock < 50).length;
        this.sobrestock = data.filter(p => p.stock > 1000).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  irProductos() { this.router.navigate(['/productos']); }
  logout() { this.authService.logout(); }
}