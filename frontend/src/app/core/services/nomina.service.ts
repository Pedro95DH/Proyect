import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Nomina {
  _id: string;
  usuario: { _id: string; nombre: string; dni: string; email: string } | string;
  mes: number;
  anio: number;
  rutaArchivo: string;
  createdAt?: string;
}

export interface NominasResponse {
  total: number;
  nominas: Nomina[];
}

@Injectable({ providedIn: 'root' })
export class NominaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/nominas`;

  // Obtiene las nóminas del empleado autenticado
  misNominas(): Observable<NominasResponse> {
    return this.http.get<NominasResponse>(`${this.apiUrl}/mis-nominas`);
  }

  // Obtiene todas las nóminas del sistema con filtro opcional por año, accesible solo por RRHH
  todas(anio?: number): Observable<NominasResponse> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio.toString());
    return this.http.get<NominasResponse>(`${this.apiUrl}/todas`, { params });
  }

  // Sube un nuevo PDF de nómina asociado a un empleado
  subir(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }

  // Devuelve la URL para descargar el PDF de una nómina (se usa con fetch para añadir el token)
  urlDescarga(nominaId: string): string {
    return `${this.apiUrl}/descargar/${nominaId}`;
  }

  // Elimina definitivamente una nómina y su PDF del disco, accesible solo por RRHH
  hardDelete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
