import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res.access_token) {
          const payload = JSON.parse(atob(res.access_token.split('.')[1]));
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('rol', payload.rol);
          localStorage.setItem('username', payload.username);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('carrito_farmasys');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const ahora = Math.floor(Date.now() / 1000);
      return payload.exp > ahora;
    } catch {
      return false;
    }
  }

  getRol(): string {
    return localStorage.getItem('rol') || '';
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }
}
