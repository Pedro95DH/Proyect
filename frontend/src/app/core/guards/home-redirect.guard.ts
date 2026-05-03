import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para la ruta raíz ('/') y el comodín ('**').
 * Si el usuario está autenticado, lo redirige al panel correcto según su rol.
 * Si no está autenticado, lo envía al login.
 */
export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rol = authService.obtenerRol();

  if (rol === 'ADMIN') return router.createUrlTree(['/admin']);
  if (rol === 'RRHH')  return router.createUrlTree(['/rrhh']);
  return router.createUrlTree(['/dashboard']);
};
