import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP funcional (Angular 17+).
 * Adjunta automáticamente el token JWT en la cabecera Authorization
 * de cada petición saliente hacia el backend.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  // Si no hay token, dejamos pasar la petición tal cual (ej: el login)
  if (!token) {
    return next(req);
  }

  // Clonamos la petición añadiendo la cabecera con el token Bearer
  const peticionAutenticada = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(peticionAutenticada);
};
