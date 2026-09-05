import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Venta, CierreData } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private apiUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}?t=${Date.now()}`);
  }

  getOne(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  create(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }

  getByFecha(fecha: string): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}/fecha?fecha=${fecha}`);
  }

  getCierre(fecha: string): Observable<CierreData> {
    return this.http.get<CierreData>(`${this.apiUrl}/cierre?fecha=${fecha}`);
  }
}
