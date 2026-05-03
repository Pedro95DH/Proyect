import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Registrar el idioma español para pipes de fecha, moneda, etc.
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Habilitar HttpClient con el interceptor JWT adjunto
    provideHttpClient(withInterceptors([authInterceptor])),
    // Animaciones de Angular Material (carga diferida para mejor rendimiento)
    provideAnimationsAsync(),
    // Usar español como idioma por defecto
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
