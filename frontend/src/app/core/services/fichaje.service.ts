import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Fichaje {
  _id: string;
  usuario?: { _id: string; nombre: string; dni: string; email: string };
  horaEntrada: string;
  horaSalida: string | null;
  horasTrabajadas: string;
  createdAt: string;
}

export interface FichajesResponse {
  total: number;
  fichajes: Fichaje[];
}

export interface FichajeAccionResponse {
  mensaje: string;
  fichaje: Fichaje;
  horasTrabajadas?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FichajeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/fichajes`;

  // Llama al backend para registrar la entrada del empleado autenticado
  ficharEntrada(): Observable<FichajeAccionResponse> {
    return this.http.post<FichajeAccionResponse>(`${this.apiUrl}/entrada`, {});
  }

  // Llama al backend para registrar la salida del empleado autenticado
  ficharSalida(): Observable<FichajeAccionResponse> {
    return this.http.put<FichajeAccionResponse>(`${this.apiUrl}/salida`, {});
  }

  // Obtiene el historial de fichajes del empleado autenticado, con filtro opcional por mes y año
  obtenerMisFichajes(mes?: number, anio?: number): Observable<FichajesResponse> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes.toString());
    if (anio) params = params.set('anio', anio.toString());

    return this.http.get<FichajesResponse>(`${this.apiUrl}/mis-fichajes`, { params });
  }

  // Obtiene todos los fichajes de todos los empleados, accesible solo por RRHH y ADMIN
  obtenerTodosFichajes(mes?: number, anio?: number, usuarioId?: string): Observable<FichajesResponse> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes.toString());
    if (anio) params = params.set('anio', anio.toString());
    if (usuarioId) params = params.set('usuarioId', usuarioId);
    return this.http.get<FichajesResponse>(`${this.apiUrl}/todos`, { params });
  }

  // Elimina definitivamente un fichaje de la BD, accesible solo por RRHH
  hardDeleteFichaje(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
 