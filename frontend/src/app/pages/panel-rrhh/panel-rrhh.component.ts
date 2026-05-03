import {
  Component, inject, signal, ViewChild, AfterViewInit, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from '../../core/services/auth.service';
import { UsuarioService, Usuario } from '../../core/services/usuario.service';
import { FichajeService, Fichaje } from '../../core/services/fichaje.service';
import { NominaService, Nomina } from '../../core/services/nomina.service';

// Validador personalizado que comprueba que las dos contraseñas coincidan
function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const conf = control.get('passwordConfirmar')?.value;
  return nueva && conf && nueva !== conf ? { noCoinciden: true } : null;
}

type Vista = 'fichaje' | 'nominas' | 'empleados' | 'perfil';

@Component({
  selector: 'app-panel-rrhh',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatToolbarModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule,
    MatCheckboxModule,
  ],
  templateUrl: './panel-rrhh.component.html',
  styleUrl: './panel-rrhh.component.scss',
})
export class PanelRrhhComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly authService = inject(AuthService);
  readonly usuarioService = inject(UsuarioService);
  private readonly fichajeService = inject(FichajeService);
  private readonly nominaService = inject(NominaService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly usuario = this.authService.obtenerUsuario();
  readonly vistaActiva = signal<Vista>('fichaje');

  // Estado de la sección de fichaje propio
  readonly horaActual = signal(new Date());
  private relojSub?: Subscription;
  readonly fichajeAbierto = signal(false);
  readonly cargandoAccion = signal(false);
  readonly dsMisFichajes = new MatTableDataSource<Fichaje>([]);
  readonly cargandoMisFichajes = signal(true);
  readonly colsMisFichaje = ['fecha', 'entrada', 'salida', 'horas', 'estado'];

  @ViewChild('paginadorFichajes') paginadorFichajes!: MatPaginator;
  @ViewChild('sortFichajes') sortFichajes!: MatSort;

  // Estado de la tabla de empleados
  readonly dsEmpleados = new MatTableDataSource<Usuario>([]);
  readonly cargandoEmpleados = signal(true);
  readonly selection = new SelectionModel<Usuario>(false, []);
  readonly modoFormEmpleado = signal<'crear' | 'editar' | null>(null);
  readonly empleadoEditando = signal<Usuario | null>(null);
  readonly fotoSeleccionada = signal<File | null>(null);
  readonly colsEmpleados = ['sel', 'foto', 'nombre', 'dni', 'email', 'cargo', 'rol', 'estado'];

  @ViewChild('paginadorEmpleados') paginadorEmpleados!: MatPaginator;
  @ViewChild('sortEmpleados') sortEmpleados!: MatSort;

  readonly formEmpleado = this.fb.group({
    nombre:    ['', [Validators.required, Validators.minLength(2)]],
    apellidos: [''],
    dni:       ['', [Validators.required, Validators.pattern(/^[0-9]{8}[A-Z]$/i)]],
    email:     ['', [Validators.required, Validators.email]],
    telefono:  [''],
    cargo:     [''],
    direccion: [''],
    password:  [''],
    rol:       ['EMPLEADO', Validators.required],
  });

  // Estado de la sección de nóminas
  readonly nominas = signal<Nomina[]>([]);
  readonly cargandoNominas = signal(true);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly subiendoNomina = signal(false);
  readonly mostrarFormNomina = signal(false);
  readonly colsNominas = ['empleado', 'periodo', 'acciones'];

  readonly formNomina = this.fb.group({
    usuarioId: ['', Validators.required],
    mes:  ['', [Validators.required, Validators.min(1), Validators.max(12)]],
    anio: ['', [Validators.required, Validators.min(2020)]],
  });

  // Estado de la auditoría de fichajes (tabla de todos los empleados)
  readonly dsAuditoria = new MatTableDataSource<Fichaje>([]);
  readonly cargandoAuditoria = signal(false);
  readonly mostrarAuditoria = signal(false);
  readonly filtroAuditoria = this.fb.group({ mes: [''], anio: [''], usuarioId: [''] });
  readonly filtroAuditoriaTexto = signal('');
  readonly colsAuditoria = ['empleado', 'fecha', 'entrada', 'salida', 'horas', 'estado', 'acciones'];

  // Filtros de la tabla de nóminas
  readonly filtroNominasTexto = signal('');
  readonly filtroNominasMes = signal('');
  readonly filtroNominasAnio = signal('');

  @ViewChild('paginadorAuditoria') paginadorAuditoria!: MatPaginator;

  // Formularios de perfil del usuario RRHH
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
    { validators: passwordsIguales }
  );

  // Estado de los formularios de perfil
  readonly guardandoPerfil = signal(false);
  readonly mostrarFormNombre = signal(false);
  readonly mostrarFormPassword = signal(false);
  readonly subiendoFoto = signal(false);

  ngOnInit(): void {
    // Iniciamos el reloj con un intervalo de 1 segundo
    this.relojSub = interval(1000).subscribe(() => this.horaActual.set(new Date()));
    this.cargarMiFichaje();
    this.cargarEmpleados();
    this.cargarNominas();
    this.formNombre.patchValue({ nombre: this.usuario?.nombre ?? '' });

    // Predicado de filtrado para la tabla de empleados
    this.dsEmpleados.filterPredicate = (data: Usuario, filtro: string) => {
      const term = filtro.toLowerCase();
      return (
        data.nombre.toLowerCase().includes(term) ||
        (data.apellidos ?? '').toLowerCase().includes(term) ||
        (data.dni ?? '').toLowerCase().includes(term) ||
        data.email.toLowerCase().includes(term) ||
        (data.cargo ?? '').toLowerCase().includes(term)
      );
    };

    // Predicado de filtrado para la tabla de auditoría (filtra por nombre de empleado)
    this.dsAuditoria.filterPredicate = (data: any, filtro: string) => {
      const nombre = typeof data.usuario === 'object'
        ? `${data.usuario?.nombre ?? ''} ${data.usuario?.apellidos ?? ''}`.toLowerCase()
        : '';
      return nombre.includes(filtro.toLowerCase());
    };
  }

  ngAfterViewInit(): void {
    // Conectamos los paginadores y sorts de cada tabla
    if (this.paginadorEmpleados) this.dsEmpleados.paginator = this.paginadorEmpleados;
    if (this.sortEmpleados)      this.dsEmpleados.sort = this.sortEmpleados;
    if (this.paginadorFichajes)  this.dsMisFichajes.paginator = this.paginadorFichajes;
    if (this.sortFichajes)       this.dsMisFichajes.sort = this.sortFichajes;
    if (this.paginadorAuditoria) this.dsAuditoria.paginator = this.paginadorAuditoria;
  }

  ngOnDestroy(): void {
    // Cancelamos la suscripción del reloj para evitar fugas de memoria
    this.relojSub?.unsubscribe();
  }

  // Cambia la sección visible y limpia el formulario y la selección
  irA(vista: Vista): void {
    this.vistaActiva.set(vista);
    this.modoFormEmpleado.set(null);
    this.selection.clear();
  }

  // Carga el historial de fichajes propios y detecta si hay un fichaje abierto hoy
  cargarMiFichaje(): void {
    this.cargandoMisFichajes.set(true);
    this.fichajeService.obtenerMisFichajes().subscribe({
      next: (r) => {
        this.dsMisFichajes.data = r.fichajes;
        const primero = r.fichajes[0];
        const hoy = new Date();
        if (primero) {
          const f = new Date(primero.horaEntrada);
          const esDehoy =
            f.getDate() === hoy.getDate() &&
            f.getMonth() === hoy.getMonth() &&
            f.getFullYear() === hoy.getFullYear();
          this.fichajeAbierto.set(esDehoy && !primero.horaSalida);
        }
        this.cargandoMisFichajes.set(false);
        setTimeout(() => {
          this.dsMisFichajes.paginator = this.paginadorFichajes;
          this.dsMisFichajes.sort = this.sortFichajes;
        });
      },
      error: (err) => {
        this.cargandoMisFichajes.set(false);
        this.error(`Error al cargar fichajes: ${err?.error?.mensaje ?? 'Error desconocido'}`);
      },
    });
  }

  // Registra entrada o salida según el estado actual del fichaje
  accionFichaje(): void {
    this.cargandoAccion.set(true);
    const accion$ = this.fichajeAbierto()
      ? this.fichajeService.ficharSalida()
      : this.fichajeService.ficharEntrada();
    accion$.subscribe({
      next: (res) => {
        this.cargandoAccion.set(false);
        this.fichajeAbierto.set(!this.fichajeAbierto());
        this.ok(res.mensaje);
        this.cargarMiFichaje();
      },
      error: (err) => { this.cargandoAccion.set(false); this.error(err.error?.mensaje ?? 'Error al fichar.'); },
    });
  }

  // Pide al backend la lista de empleados y la carga en la tabla
  cargarEmpleados(): void {
    this.cargandoEmpleados.set(true);
    this.usuarioService.listar().subscribe({
      next: (r) => {
        this.dsEmpleados.data = r.empleados;
        this.cargandoEmpleados.set(false);
        setTimeout(() => {
          this.dsEmpleados.paginator = this.paginadorEmpleados;
          this.dsEmpleados.sort = this.sortEmpleados;
        });
      },
      error: (err) => {
        this.cargandoEmpleados.set(false);
        this.error(`No se pudo cargar la plantilla: ${err?.error?.mensaje ?? 'Error desconocido'}`);
      },
    });
  }

  // Filtra la tabla de empleados en tiempo real
  filtrarEmpleados(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.dsEmpleados.filter = valor.trim().toLowerCase();
    if (this.dsEmpleados.paginator) {
      this.dsEmpleados.paginator.firstPage();
    }
  }

  get empleadoSeleccionado(): Usuario | null {
    return this.selection.selected[0] ?? null;
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fotoSeleccionada.set(input.files?.[0] ?? null);
  }

  // Prepara el formulario en modo crear
  abrirFormCrear(): void {
    this.selection.clear();
    this.empleadoEditando.set(null);
    this.fotoSeleccionada.set(null);
    this.formEmpleado.reset({ rol: 'EMPLEADO' });
    this.formEmpleado.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.formEmpleado.get('password')!.updateValueAndValidity();
    this.modoFormEmpleado.set('crear');
  }

  // Carga los datos del empleado seleccionado en el formulario para editarlos
  abrirFormEditar(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp) return;
    this.fotoSeleccionada.set(null);
    this.empleadoEditando.set(emp);
    this.formEmpleado.patchValue({
      nombre: emp.nombre, apellidos: emp.apellidos ?? '',
      dni: emp.dni, email: emp.email,
      telefono: emp.telefono ?? '', cargo: emp.cargo ?? '',
      direccion: emp.direccion ?? '', rol: emp.rol, password: '',
    });
    this.formEmpleado.get('password')!.clearValidators();
    this.formEmpleado.get('password')!.updateValueAndValidity();
    this.modoFormEmpleado.set('editar');
  }

  cancelarForm(): void {
    this.modoFormEmpleado.set(null);
    this.formEmpleado.reset();
    this.selection.clear();
  }

  // Crea o actualiza el empleado según el modo activo del formulario
  guardarEmpleado(): void {
    if (this.formEmpleado.invalid) return;
    const val = this.formEmpleado.value;

    if (this.modoFormEmpleado() === 'crear') {
      this.usuarioService.crear({
        nombre: val.nombre!, apellidos: val.apellidos ?? '',
        dni: val.dni!, email: val.email!,
        telefono: val.telefono ?? '', cargo: val.cargo ?? '',
        direccion: val.direccion ?? '',
        password: val.password!,
        rol: val.rol || 'EMPLEADO',
      }, this.fotoSeleccionada()).subscribe({
        next: () => { this.ok('Empleado creado.'); this.cancelarForm(); this.cargarEmpleados(); },
        error: (e) => this.error(e.error?.mensaje ?? 'Error al crear el empleado.'),
      });
    } else {
      const id = this.empleadoEditando()!._id;
      const payload: any = {
        nombre: val.nombre, apellidos: val.apellidos,
        dni: val.dni, email: val.email,
        telefono: val.telefono, cargo: val.cargo, direccion: val.direccion,
      };
      if (val.password) payload.password = val.password;
      this.usuarioService.editar(id, payload, this.fotoSeleccionada()).subscribe({
        next: () => { this.ok('Empleado actualizado.'); this.cancelarForm(); this.cargarEmpleados(); },
        error: (e) => this.error(e.error?.mensaje ?? 'Error al actualizar.'),
      });
    }
  }

  // Baja lógica del empleado seleccionado
  bajaLogica(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp || !confirm(`¿Dar de baja a ${emp.nombre}?`)) return;
    this.usuarioService.bajaLogica(emp._id).subscribe({
      next: () => { this.ok(`${emp.nombre} dado de baja.`); this.selection.clear(); this.cargarEmpleados(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al dar de baja.'),
    });
  }

  // Reactiva al empleado seleccionado
  reactivar(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp) return;
    this.usuarioService.reactivar(emp._id).subscribe({
      next: () => { this.ok(`${emp.nombre} reactivado.`); this.selection.clear(); this.cargarEmpleados(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al reactivar.'),
    });
  }

  // Carga todas las nóminas del sistema
  cargarNominas(): void {
    this.cargandoNominas.set(true);
    this.nominaService.todas().subscribe({
      next: (r) => { this.nominas.set(r.nominas); this.cargandoNominas.set(false); },
      error: () => { this.cargandoNominas.set(false); this.error('No se pudieron cargar las nóminas.'); },
    });
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.archivoSeleccionado.set(input.files[0]);
  }

  // Sube una nueva nómina PDF al backend con los datos del formulario
  subirNomina(): void {
    if (this.formNomina.invalid || !this.archivoSeleccionado()) return;
    const { usuarioId, mes, anio } = this.formNomina.value;
    const fd = new FormData();
    fd.append('archivo', this.archivoSeleccionado()!);
    fd.append('usuarioId', usuarioId!);
    fd.append('mes', mes!);
    fd.append('anio', anio!);
    this.subiendoNomina.set(true);
    this.nominaService.subir(fd).subscribe({
      next: () => {
        this.subiendoNomina.set(false);
        this.ok('Nómina subida correctamente.');
        this.formNomina.reset();
        this.archivoSeleccionado.set(null);
        this.mostrarFormNomina.set(false);
        this.cargarNominas();
      },
      error: (e) => { this.subiendoNomina.set(false); this.error(e.error?.mensaje ?? 'Error al subir la nómina.'); },
    });
  }

  // Elimina definitivamente una nómina y su PDF
  eliminarNomina(id: string, empleado: string): void {
    if (!confirm(`¿Eliminar definitivamente la nómina de ${empleado}?`)) return;
    this.nominaService.hardDelete(id).subscribe({
      next: () => { this.ok('Nómina eliminada.'); this.cargarNominas(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al eliminar la nómina.'),
    });
  }

  // Descarga el PDF de una nómina usando fetch para poder enviar el token de autorización
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

  // Carga los fichajes de todos los empleados según los filtros del formulario de auditoría
  cargarAuditoria(): void {
    this.cargandoAuditoria.set(true);
    const { mes, anio, usuarioId } = this.filtroAuditoria.value;
    this.fichajeService.obtenerTodosFichajes(
      mes ? +mes : undefined, anio ? +anio : undefined, usuarioId || undefined
    ).subscribe({
      next: (r) => { this.dsAuditoria.data = r.fichajes as any; this.cargandoAuditoria.set(false); },
      error: () => { this.cargandoAuditoria.set(false); this.error('No se pudieron cargar los fichajes.'); },
    });
  }

  // Muestra u oculta la sección de auditoría, cargando los datos la primera vez
  toggleAuditoria(): void {
    if (!this.mostrarAuditoria()) this.cargarAuditoria();
    this.mostrarAuditoria.update(v => !v);
  }

  // Filtra la tabla de auditoría por nombre de empleado
  filtrarAuditoriaTexto(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.filtroAuditoriaTexto.set(valor);
    this.dsAuditoria.filter = valor.trim().toLowerCase();
    if (this.dsAuditoria.paginator) this.dsAuditoria.paginator.firstPage();
  }

  filtrarNominas(event: Event): void {
    this.filtroNominasTexto.set((event.target as HTMLInputElement).value);
  }

  // Filtra las nóminas por nombre de empleado, mes y año combinados
  get nominasFiltradas() {
    const texto = this.filtroNominasTexto().toLowerCase().trim();
    const mes = this.filtroNominasMes().trim();
    const anio = this.filtroNominasAnio().trim();
    return this.nominas().filter(n => {
      const empleadoOk = !texto || this.nombreEmpleado((n as any).usuario).toLowerCase().includes(texto);
      const mesOk = !mes || n.mes === +mes;
      const anioOk = !anio || n.anio === +anio;
      return empleadoOk && mesOk && anioOk;
    });
  }

  // Calcula el número de semana ISO de una fecha (usado para el resumen de horas semanales)
  private getISOWeek(d: Date): string {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  private getCurrentISOWeek(): string {
    return this.getISOWeek(new Date());
  }

  // Agrupa los fichajes de auditoría por empleado y calcula totales de horas y días trabajados
  get resumenHorasAuditoria(): { nombre: string; totalHoras: number; dias: number; horasSemanales: number }[] {
    const currentWeek = this.getCurrentISOWeek();
    const mapa = new Map<string, { nombre: string; totalHoras: number; dias: Set<string>; horasSemanales: number }>();
    for (const f of this.dsAuditoria.data as any[]) {
      const nombre = this.nombreEmpleado(f.usuario);
      const horasStr: string = f.horasTrabajadas ?? '';
      const horas = parseFloat(horasStr.replace('h', '')) || 0;
      const fechaObj = f.horaEntrada ? new Date(f.horaEntrada) : null;
      const dia = fechaObj ? fechaObj.toDateString() : '';
      const semana = fechaObj ? this.getISOWeek(fechaObj) : '';
      if (!mapa.has(nombre)) mapa.set(nombre, { nombre, totalHoras: 0, dias: new Set(), horasSemanales: 0 });
      const entry = mapa.get(nombre)!;
      entry.totalHoras += horas;
      if (dia) entry.dias.add(dia);
      if (semana === currentWeek) entry.horasSemanales += horas;
    }
    return Array.from(mapa.values())
      .map(e => ({
        nombre: e.nombre,
        totalHoras: +e.totalHoras.toFixed(2),
        dias: e.dias.size,
        horasSemanales: +e.horasSemanales.toFixed(2),
      }))
      .sort((a, b) => b.totalHoras - a.totalHoras);
  }

  // Elimina definitivamente un fichaje de la auditoría
  eliminarFichaje(id: string): void {
    if (!confirm('¿Eliminar definitivamente este fichaje?')) return;
    this.fichajeService.hardDeleteFichaje(id).subscribe({
      next: () => { this.ok('Fichaje eliminado.'); this.cargarAuditoria(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al eliminar el fichaje.'),
    });
  }

  // Guarda el nombre del usuario RRHH en el backend y en localStorage
  guardarNombre(): void {
    if (this.formNombre.invalid) return;
    this.guardandoPerfil.set(true);
    const { nombre } = this.formNombre.value;
    this.authService.cambiarNombre(nombre!).subscribe({
      next: () => {
        this.authService.actualizarNombreLocal(nombre!);
        this.guardandoPerfil.set(false);
        this.mostrarFormNombre.set(false);
        this.ok('Nombre actualizado.');
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al actualizar.'); },
    });
  }

  // Guarda el email del usuario RRHH en el backend y en localStorage
  guardarEmail(): void {
    if (this.formEmail.invalid) return;
    this.guardandoPerfil.set(true);
    const { email } = this.formEmail.value;
    this.authService.cambiarEmail(email!).subscribe({
      next: (r) => {
        this.authService.actualizarEmailLocal(r.email);
        this.guardandoPerfil.set(false);
        this.mostrarFormEmail.set(false);
        this.ok('Email actualizado.');
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al actualizar el email.'); },
    });
  }

  // Guarda la nueva contraseña del usuario RRHH en el backend
  guardarPassword(): void {
    if (this.formPassword.invalid) return;
    this.guardandoPerfil.set(true);
    const { passwordActual, passwordNueva } = this.formPassword.value;
    this.authService.cambiarPassword(passwordActual!, passwordNueva!).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.formPassword.reset();
        this.mostrarFormPassword.set(false);
        this.ok('Contraseña cambiada.');
      },
      error: (e) => { this.guardandoPerfil.set(false); this.error(e.error?.mensaje ?? 'Error al cambiar la contraseña.'); },
    });
  }

  // Devuelve el nombre del mes en español dado su número
  nombreMes(mes: number): string {
    return new Date(2000, mes - 1, 1).toLocaleString('es', { month: 'long' });
  }

  // Extrae el nombre del empleado de un objeto usuario o devuelve un guión si no hay datos
  nombreEmpleado(usuario: any): string {
    return typeof usuario === 'object' ? (usuario?.nombre ?? '—') : '—';
  }

  // Sube la foto de perfil del usuario RRHH al backend
  subirFotoPropia(event: Event): void {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    if (!foto) return;
    this.subiendoFoto.set(true);
    this.authService.subirFotoPerfil(foto).subscribe({
      next: (r) => {
        this.authService.actualizarFotoLocal(r.fotoPerfil);
        this.subiendoFoto.set(false);
        this.ok('Foto de perfil actualizada.');
      },
      error: (e) => { this.subiendoFoto.set(false); this.error(e.error?.mensaje ?? 'Error al subir la foto.'); },
    });
  }

  cerrarSesion(): void { this.authService.logout(); }

  // Métodos auxiliares para mostrar notificaciones de éxito o error
  private ok(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', { duration: 3500 });
  }
  private error(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snack-error' });
  }
}
