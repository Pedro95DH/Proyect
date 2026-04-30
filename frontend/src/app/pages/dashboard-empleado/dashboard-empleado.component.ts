import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../core/services/auth.service';
import { FichajeService, Fichaje } from '../../core/services/fichaje.service';
import { NominaService, Nomina } from '../../core/services/nomina.service';

function passwordsIgualesEmpleado(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const conf = control.get('passwordConfirmar')?.value;
  return nueva && conf && nueva !== conf ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-dashboard-empleado',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dashboard-empleado.component.html',
  styleUrl: './dashboard-empleado.component.scss',
})
export class DashboardEmpleadoComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly fichajeService = inject(FichajeService);
  private readonly nominaService = inject(NominaService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly usuario = this.authService.obtenerUsuario();

  // Vista activa de la navegación (fichaje, nominas o perfil)
  readonly vistaActiva = signal<'fichaje' | 'nominas' | 'perfil'>('fichaje');
  irA(vista: 'fichaje' | 'nominas' | 'perfil'): void { this.vistaActiva.set(vista); }

  // Reloj actualizado cada segundo
  readonly horaActual = signal(new Date());
  private relojSubscription?: Subscription;

  // Estado de la sección de fichaje
  readonly cargandoAccion = signal(false);
  readonly cargandoHistorial = signal(false);
  readonly fichajeAbierto = signal(false);
  readonly fichajes = signal<Fichaje[]>([]);
  readonly columnasTabla = ['fecha', 'entrada', 'salida', 'horas', 'estado'];

  // Estado de la sección de nóminas
  readonly nominas = signal<Nomina[]>([]);
  readonly cargandoNominas = signal(false);
  readonly columnasNominas = ['periodo', 'acciones'];
  readonly filtroNominasMes = signal('');
  readonly filtroNominasAnio = signal('');

  // Estado de la sección de perfil
  readonly mostrarFormNombre = signal(false);
  readonly mostrarFormPassword = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly subiendoFoto = signal(false);

  readonly formNombre = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly formEmail = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly mostrarFormEmail = signal(false);

  readonly formPassword = this.fb.group(
    {
      passwordActual:    ['', Validators.required],
      passwordNueva:     ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', Validators.required],
    },
    { validators: passwordsIgualesEmpleado }
  );

  ngOnInit(): void {
    this.relojSubscription = interval(1000).subscribe(() => this.horaActual.set(new Date()));
    this.cargarFichajes();
    this.cargarNominas();
  }

  ngOnDestroy(): void {
    this.relojSubscription?.unsubscribe();
  }

  // Carga el historial de fichajes y detecta si hay uno abierto hoy
  cargarFichajes(): void {
    this.cargandoHistorial.set(true);
    this.fichajeService.obtenerMisFichajes().subscribe({
      next: (respuesta) => {
        this.fichajes.set(respuesta.fichajes);
        const primero = respuesta.fichajes[0];
        const hoy = new Date();
        if (primero) {
          const f = new Date(primero.horaEntrada);
          const esDehoy = f.getDate() === hoy.getDate() &&
            f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
          this.fichajeAbierto.set(esDehoy && !primero.horaSalida);
        }
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.cargandoHistorial.set(false);
        this.error('No se pudo cargar el historial de fichajes.');
      },
    });
  }

  accionFichaje(): void {
    this.cargandoAccion.set(true);
    const accion$ = this.fichajeAbierto()
      ? this.fichajeService.ficharSalida()
      : this.fichajeService.ficharEntrada();

    accion$.subscribe({
      next: (res) => {
        this.cargandoAccion.set(false);
        this.fichajeAbierto.set(!this.fichajeAbierto());
        this.snackBar.open(res.mensaje, 'Cerrar', { duration: 4000 });
        this.cargarFichajes();
      },
      error: (err) => {
        this.cargandoAccion.set(false);
        this.error(err.error?.mensaje ?? 'Error al registrar el fichaje.');
      },
    });
  }

  // Carga las nóminas del empleado autenticado
  cargarNominas(): void {
    this.cargandoNominas.set(true);
    this.nominaService.misNominas().subscribe({
      next: (r) => { this.nominas.set(r.nominas); this.cargandoNominas.set(false); },
      error: () => { this.cargandoNominas.set(false); this.error('No se pudieron cargar las nóminas.'); },
    });
  }

  descargarNomina(id: string): void {
    const token = this.authService.obtenerToken();
    const url = this.nominaService.urlDescarga(id);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nomina.pdf';
        a.click();
      });
  }

  nombreMes(mes: number): string {
    return new Date(2000, mes - 1, 1).toLocaleString('es', { month: 'long' });
  }

  get nominasFiltradas(): Nomina[] {
    const mes = this.filtroNominasMes().trim();
    const anio = this.filtroNominasAnio().trim();
    return this.nominas().filter(n => {
      const mesOk = !mes || n.mes === +mes;
      const anioOk = !anio || n.anio === +anio;
      return mesOk && anioOk;
    });
  }

  // Guarda el nuevo nombre del empleado en el backend
  guardarNombre(): void {
    if (this.formNombre.invalid) return;
    this.guardandoPerfil.set(true);
    const { nombre } = this.formNombre.value;
    this.authService.cambiarNombre(nombre!).subscribe({
      next: () => {
        this.authService.actualizarNombreLocal(nombre!);
        this.guardandoPerfil.set(false);
        this.mostrarFormNombre.set(false);
        this.snackBar.open('Nombre actualizado.', 'Cerrar', { duration: 3500 });
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al actualizar.'); },
    });
  }

  guardarEmail(): void {
    if (this.formEmail.invalid) return;
    this.guardandoPerfil.set(true);
    const { email } = this.formEmail.value;
    this.authService.cambiarEmail(email!).subscribe({
      next: (r) => {
        this.authService.actualizarEmailLocal(r.email);
        this.guardandoPerfil.set(false);
        this.mostrarFormEmail.set(false);
        this.snackBar.open('Email actualizado.', 'Cerrar', { duration: 3500 });
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al actualizar el email.'); },
    });
  }

  guardarPassword(): void {
    if (this.formPassword.invalid) return;
    this.guardandoPerfil.set(true);
    const { passwordActual, passwordNueva } = this.formPassword.value;
    this.authService.cambiarPassword(passwordActual!, passwordNueva!).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.formPassword.reset();
        this.mostrarFormPassword.set(false);
        this.snackBar.open('Contraseña cambiada.', 'Cerrar', { duration: 3500 });
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al cambiar la contraseña.'); },
    });
  }

  subirFotoPropia(event: Event): void {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    if (!foto) return;
    this.subiendoFoto.set(true);
    this.authService.subirFotoPerfil(foto).subscribe({
      next: (r) => {
        this.authService.actualizarFotoLocal(r.fotoPerfil);
        this.subiendoFoto.set(false);
        this.snackBar.open('Foto de perfil actualizada.', 'Cerrar', { duration: 3500 });
      },
      error: (e) => { this.subiendoFoto.set(false); this.error(e.error?.mensaje ?? 'Error al subir la foto.'); },
    });
  }

  cerrarSesion(): void { this.authService.logout(); }

  private error(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snack-error' });
  }
}
