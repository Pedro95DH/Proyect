import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  _id: string;
  nombre: string;
  apellidos?: string;
  dni: string;
  email: string;
  telefono?: string;
  cargo?: string;
  direccion?: string;
  rol: 'EMPLEADO' | 'RRHH' | 'ADMIN';
  activo: boolean;
  debeCambiarPassword: boolean;
  fotoPerfil?: string;
  createdAt?: string;
}

export interface UsuariosResponse {
  total: number;
  empleados: Usuario[];
}

export interface NuevoUsuarioPayload {
  nombre: string;
  apellidos?: string;
  dni: string;
  email: string;
  telefono?: string;
  cargo?: string;
  direccion?: string;
  password: string;
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // Obtiene la lista completa de empleados del sistema
  listar(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(this.apiUrl);
  }

  // Crea un nuevo empleado enviando los datos como FormData para poder incluir foto opcional
  crear(payload: NuevoUsuarioPayload, foto?: File | null): Observable<any> {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as string); });
    if (foto) fd.append('foto', foto);
    return this.http.post(`${this.apiUrl}/crear`, fd);
  }

  // Actualiza los datos de un empleado existente, incluyendo foto si se proporciona
  editar(id: string, payload: Partial<NuevoUsuarioPayload>, foto?: File | null): Observable<any> {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
    if (foto) fd.append('foto', foto);
    return this.http.put(`${this.apiUrl}/${id}`, fd);
  }

  // Marca al empleado como inactivo sin borrarlo de la BD
  bajaLogica(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/baja`, {});
  }

  // Reactiva a un empleado que estaba dado de baja
  reactivar(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reactivar`, {});
  }

  // Elimina definitivamente al usuario de la BD, solo disponible para ADMIN
  hardDelete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Construye la URL pública de la foto de perfil de un usuario
  urlFoto(filename: string): string {
    return `http://localhost:3000/uploads/fotos/${filename}`;
  }
}
