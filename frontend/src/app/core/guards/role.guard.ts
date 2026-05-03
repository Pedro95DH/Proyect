import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional (Angular 17+) para control de acceso por rol.
 * Se configura en las rutas con data: { roles: ['ADMIN', 'RRHH'] }.
 *
 * Si el usuario no tiene el rol requerido, lo redirige a SU propio panel
 * en lugar de un dashboard genérico (evita bucles de redirección).
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos: string[] = route.data['roles'] ?? [];
  const rolUsuario = authService.obtenerRol();

  if (rolUsuario && rolesPermitidos.includes(rolUsuario)) {
    return true;
  }

  // Redirigir al panel que corresponde al rol del usuario
  if (rolUsuario === 'ADMIN')  return router.createUrlTree(['/admin']);
  if (rolUsuario === 'RRHH')   return router.createUrlTree(['/rrhh']);
  return router.createUrlTree(['/dashboard']);
};
