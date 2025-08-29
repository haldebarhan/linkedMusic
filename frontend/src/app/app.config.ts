import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './auth/auth.service';
import { authInterceptor } from './auth/auth.interceptor';
import { RefreshTokenService } from './auth/refresh-token.service';

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
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService, RefreshTokenService],
      multi: true,
    },
  ],
};
