import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}?t=${Date.now()}`);
  }

  getOne(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  create(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  update(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAnalisis(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analisis?t=${Date.now()}`);
  }

  getRotacion(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rotacion?t=${Date.now()}`);
  }
}
