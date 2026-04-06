import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: {
    _id: string;
    nombre: string;
    apellidos?: string;
    email: string;
    rol: string;
    debeCambiarPassword: boolean;
    fotoPerfil?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Claves que usamos para guardar el token y los datos del usuario en localStorage
  private readonly TOKEN_KEY = 'sgfn_token';
  private readonly USER_KEY = 'sgfn_usuario';

  // Envía las credenciales al backend y guarda el token y datos del usuario si son correctas
  login(credenciales: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((respuesta) => {
        localStorage.setItem(this.TOKEN_KEY, respuesta.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(respuesta.usuario));
      })
    );
  }

  // Borra el token y los datos de sesión y redirige al login
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  // Devuelve el token JWT guardado en localStorage, o null si no hay sesión
  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Indica si el usuario tiene sesión activa comprobando si hay token
  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }

  // Devuelve los datos básicos del usuario guardados en localStorage
  obtenerUsuario(): { nombre: string; apellidos?: string; email?: string; rol: string; fotoPerfil?: string } | null {
    const datos = localStorage.getItem(this.USER_KEY);
    return datos ? JSON.parse(datos) : null;
  }

  // Devuelve el rol del usuario autenticado (EMPLEADO, RRHH o ADMIN)
  obtenerRol(): string | null {
    return this.obtenerUsuario()?.rol ?? null;
  }

  // Actualiza el nombre en localStorage sin necesidad de volver a hacer login
  actualizarNombreLocal(nuevoNombre: string): void {
    const u = this.obtenerUsuario();
    if (u) {
      u.nombre = nuevoNombre;
      localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    }
  }

  // Manda al backend el nuevo nombre del usuario autenticado
  cambiarNombre(nombre: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-nombre`, { nombre });
  }

  // Manda al backend el nuevo email del usuario autenticado
  cambiarEmail(email: string): Observable<{ mensaje: string; email: string }> {
    return this.http.put<{ mensaje: string; email: string }>(`${this.apiUrl}/cambiar-email`, { email });
  }

  // Actualiza el email en localStorage para que la UI lo refleje al momento
  actualizarEmailLocal(email: string): void {
    const u = this.obtenerUsuario() as any;
    if (u) {
      u.email = email;
      localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    }
  }

  // Manda al backend la contraseña actual y la nueva para cambiarla
  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-password`, { passwordActual, passwordNueva });
  }

  // Versión para el flujo de primer acceso: solo envía la nueva contraseña
  cambiarPasswordForzado(passwordNueva: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-password`, { passwordNueva });
  }

  // Sube la foto de perfil al backend usando FormData
  subirFotoPerfil(foto: File): Observable<any> {
    const fd = new FormData();
    fd.append('foto', foto);
    return this.http.put(`${this.apiUrl}/foto-perfil`, fd);
  }

  // Actualiza el nombre del archivo de foto en localStorage para no tener que refrescar
  actualizarFotoLocal(fotoPerfil: string): void {
    const u = this.obtenerUsuario();
    if (u) {
      (u as any).fotoPerfil = fotoPerfil;
      localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    }
  }

  // Construye la URL pública para mostrar una foto de perfil por su nombre de archivo
  urlFoto(filename: string): string {
    return `http://localhost:3000/uploads/fotos/${filename}`;
  }
}
 