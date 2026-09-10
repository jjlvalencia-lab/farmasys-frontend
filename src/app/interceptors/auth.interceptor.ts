import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const clonedReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          localStorage.removeItem('username');
          router.navigate(['/login']);
          break;
        case 403:
          router.navigate(['/dashboard']);
          break;
        case 0:
          console.error('Sin conexión con el servidor');
          break;
        default:
          console.error(`Error ${error.status}: ${error.message}`);
      }
      return throwError(() => error);
    })
  );
};
