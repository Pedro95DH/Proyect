import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';

function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nuevaPassword')?.value;
  const conf = control.get('confirmar')?.value;
  return nueva && conf && nueva !== conf ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly cargando = signal(false);
  readonly ocultarPassword = signal(true);
  readonly modoForzarPassword = signal(false);
  readonly currentYear = new Date().getFullYear();

  // Rol guardado temporalmente para redirigir después del cambio de password
  private rolPendiente = '';

  readonly formulario = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly formNuevaPassword = this.fb.group(
    {
      nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    },
    { validators: passwordsIguales }
  );

  togglePassword(event: MouseEvent): void {
    event.stopPropagation();
    this.ocultarPassword.update((v) => !v);
  }

  iniciarSesion(): void {
    if (this.formulario.invalid) return;
    this.cargando.set(true);
    const { email, password } = this.formulario.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (respuesta.usuario.debeCambiarPassword) {
          this.rolPendiente = respuesta.usuario.rol;
          this.modoForzarPassword.set(true);
        } else {
          this.redirigirSegunRol(respuesta.usuario.rol);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.mensaje ?? 'Error al iniciar sesión. Inténtalo de nuevo.';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  guardarNuevaPassword(): void {
    if (this.formNuevaPassword.invalid) return;
    this.cargando.set(true);
    const { nuevaPassword } = this.formNuevaPassword.value;

    this.authService.cambiarPasswordForzado(nuevaPassword!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.snackBar.open('Contraseña establecida correctamente. ¡Bienvenido!', 'Cerrar', { duration: 3500 });
        this.redirigirSegunRol(this.rolPendiente);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.mensaje ?? 'Error al cambiar la contraseña.';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  private redirigirSegunRol(rol: string): void {
    switch (rol) {
      case 'ADMIN':  this.router.navigate(['/admin']); break;
      case 'RRHH':   this.router.navigate(['/rrhh']); break;
      default:       this.router.navigate(['/dashboard']);
    }
  }
}
