import {
  Component, inject, signal, ViewChild, AfterViewInit, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

import { AuthService } from '../../core/services/auth.service';
import { UsuarioService, Usuario } from '../../core/services/usuario.service';

type Vista = 'empleados' | 'perfil';

// Validador personalizado que comprueba que las dos contraseñas del formulario coincidan
function passwordsIgualesAdmin(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const conf = control.get('passwordConfirmar')?.value;
  return nueva && conf && nueva !== conf ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
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
    MatCheckboxModule,
  ],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.scss',
})
export class PanelAdminComponent implements OnInit, AfterViewInit {
  readonly authService = inject(AuthService);
  readonly usuarioService = inject(UsuarioService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly usuario = this.authService.obtenerUsuario();

  // Vista activa del panel (empleados o perfil)
  readonly vistaActiva = signal<Vista>('empleados');

  // Tabla de empleados con DataSource para filtrado, paginación y ordenación
  readonly dataSource = new MatTableDataSource<Usuario>([]);
  readonly cargandoEmpleados = signal(true);
  readonly selection = new SelectionModel<Usuario>(false, []);

  readonly colsEmpleados = ['sel', 'foto', 'nombre', 'dni', 'email', 'cargo', 'rol', 'estado'];

  @ViewChild('paginadorEmpleados') paginadorEmpleados!: MatPaginator;
  @ViewChild('sortEmpleados') sortEmpleados!: MatSort;

  // Estado del formulario de crear/editar empleado
  readonly modoForm = signal<'crear' | 'editar' | null>(null);
  readonly empleadoEditando = signal<Usuario | null>(null);
  readonly fotoSeleccionada = signal<File | null>(null);

  readonly formEmpleado = this.fb.group({
    nombre:    ['', [Validators.required, Validators.minLength(2)]],
    apellidos: [''],
    dni:       ['', [Validators.required, Validators.pattern(/^[0-9]{8}[A-Z]$/i)]],
    email:     ['', [Validators.required, Validators.email]],
    telefono:  [''],
    cargo:     [''],
    direccion: [''],
    password:  [''],
    rol:       ['EMPLEADO'],
  });

  // Formularios de perfil del admin
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
    { validators: passwordsIgualesAdmin }
  );

  // Estado de los formularios de perfil (guardando, mostrando, etc.)
  readonly guardandoPerfil = signal(false);
  readonly mostrarFormNombre = signal(false);
  readonly mostrarFormPassword = signal(false);
  readonly subiendoFoto = signal(false);

  ngOnInit(): void {
    this.cargarEmpleados();
    this.formNombre.patchValue({ nombre: this.usuario?.nombre ?? '' });

    // Predicado de filtrado que busca en varios campos a la vez
    this.dataSource.filterPredicate = (data: Usuario, filtro: string) => {
      const term = filtro.toLowerCase();
      return (
        data.nombre.toLowerCase().includes(term) ||
        (data.apellidos ?? '').toLowerCase().includes(term) ||
        (data.dni ?? '').toLowerCase().includes(term) ||
        data.email.toLowerCase().includes(term) ||
        (data.cargo ?? '').toLowerCase().includes(term) ||
        data.rol.toLowerCase().includes(term)
      );
    };
  }

  ngAfterViewInit(): void {
    // Conectamos el paginador y el sort si la tabla ya está visible al iniciar
    if (this.paginadorEmpleados) this.dataSource.paginator = this.paginadorEmpleados;
    if (this.sortEmpleados) this.dataSource.sort = this.sortEmpleados;
  }

  // Cambia la sección visible del panel y limpia el formulario y la selección
  irA(vista: Vista): void {
    this.vistaActiva.set(vista);
    this.modoForm.set(null);
    this.selection.clear();
  }

  // Filtra la tabla en tiempo real según el texto escrito en el buscador
  filtrar(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.dataSource.filter = valor.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Pide al backend la lista de empleados y la carga en la tabla
  cargarEmpleados(): void {
    this.cargandoEmpleados.set(true);
    this.usuarioService.listar().subscribe({
      next: (r) => {
        this.dataSource.data = r.empleados;
        this.cargandoEmpleados.set(false);
        // Reconnectamos paginator y sort en el siguiente ciclo porque el @if puede haber ocultado la tabla
        setTimeout(() => {
          this.dataSource.paginator = this.paginadorEmpleados;
          this.dataSource.sort = this.sortEmpleados;
        });
      },
      error: (err) => {
        this.cargandoEmpleados.set(false);
        const msg = err?.error?.mensaje ?? err?.message ?? 'Error desconocido';
        this.error(`No se pudo cargar la plantilla: ${msg}`);
      },
    });
  }

  get empleadoSeleccionado(): Usuario | null {
    return this.selection.selected[0] ?? null;
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fotoSeleccionada.set(input.files?.[0] ?? null);
  }

  // Prepara el formulario en modo crear con los campos vacíos y la contraseña obligatoria
  abrirFormCrear(): void {
    this.selection.clear();
    this.empleadoEditando.set(null);
    this.fotoSeleccionada.set(null);
    this.formEmpleado.reset({ rol: 'EMPLEADO' });
    this.formEmpleado.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.formEmpleado.get('password')!.updateValueAndValidity();
    this.modoForm.set('crear');
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
    this.modoForm.set('editar');
  }

  cancelarForm(): void {
    this.modoForm.set(null);
    this.formEmpleado.reset();
    this.selection.clear();
  }

  // Guarda el empleado: crea uno nuevo o actualiza el existente según el modo del formulario
  guardarEmpleado(): void {
    if (this.formEmpleado.invalid) return;
    const val = this.formEmpleado.value;

    if (this.modoForm() === 'crear') {
      this.usuarioService.crear({
        nombre: val.nombre!, apellidos: val.apellidos ?? '',
        dni: val.dni!, email: val.email!,
        telefono: val.telefono ?? '', cargo: val.cargo ?? '',
        direccion: val.direccion ?? '',
        password: val.password!, rol: val.rol!,
      }, this.fotoSeleccionada()).subscribe({
        next: () => { this.ok('Usuario creado.'); this.cancelarForm(); this.cargarEmpleados(); },
        error: (e) => this.error(e.error?.mensaje ?? 'Error al crear el usuario.'),
      });
    } else {
      const id = this.empleadoEditando()!._id;
      const payload: any = {
        nombre: val.nombre, apellidos: val.apellidos,
        dni: val.dni, email: val.email,
        telefono: val.telefono, cargo: val.cargo, direccion: val.direccion,
        rol: val.rol,
      };
      if (val.password) payload.password = val.password;
      this.usuarioService.editar(id, payload, this.fotoSeleccionada()).subscribe({
        next: () => { this.ok('Usuario actualizado.'); this.cancelarForm(); this.cargarEmpleados(); },
        error: (e) => this.error(e.error?.mensaje ?? 'Error al actualizar.'),
      });
    }
  }

  // Da de baja lógica al empleado seleccionado (activo: false)
  bajaLogica(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp || !confirm(`¿Dar de baja a ${emp.nombre}? El registro permanecerá en la BD.`)) return;
    this.usuarioService.bajaLogica(emp._id).subscribe({
      next: () => { this.ok(`${emp.nombre} dado de baja.`); this.selection.clear(); this.cargarEmpleados(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al dar de baja.'),
    });
  }

  // Reactiva al empleado seleccionado (activo: true)
  reactivar(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp) return;
    this.usuarioService.reactivar(emp._id).subscribe({
      next: () => { this.ok(`${emp.nombre} reactivado.`); this.selection.clear(); this.cargarEmpleados(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al reactivar.'),
    });
  }

  // Elimina definitivamente el empleado de la BD (acción irreversible)
  hardDelete(): void {
    const emp = this.empleadoSeleccionado;
    if (!emp || !confirm(
      `⚠️ BORRADO DEFINITIVO\n\n¿Eliminar a ${emp.nombre} de la base de datos?\nEsta acción NO se puede deshacer (LOPD/GDPR).`
    )) return;
    this.usuarioService.hardDelete(emp._id).subscribe({
      next: () => { this.ok(`${emp.nombre} eliminado permanentemente.`); this.selection.clear(); this.cargarEmpleados(); },
      error: (e) => this.error(e.error?.mensaje ?? 'Error al eliminar.'),
    });
  }

  // Guarda el nombre del admin en el backend y actualiza localStorage
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

  // Guarda el email del admin en el backend y actualiza localStorage
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

  // Guarda la nueva contraseña del admin en el backend
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

  // Sube la foto de perfil del admin al backend
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
