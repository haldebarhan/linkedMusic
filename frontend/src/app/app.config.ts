import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthService } from './auth/auth.service';
import { AuthInterceptor } from './auth/auth.interceptor';
import { RefreshTokenService } from './auth/refresh-token.service';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

// Enregistrement des données de locale française
registerLocaleData(localeFr, 'fr');

function initAuth(auth: AuthService, refresher: RefreshTokenService) {
  return () => {
    auth.init(); // restaure l'état depuis localStorage
    refresher.startAutoRefresh(); // programme le refresh proactif
  };
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error: any) => error?.status !== 401 && failureCount < 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService, RefreshTokenService],
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useValue: 'fr',
    },
  ],
};
