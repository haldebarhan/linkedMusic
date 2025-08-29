import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthUser } from '../shared/interfaces/auth';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  login(payload: { email: string; password: string }) {
    return this.http
      .post<{
        statusCode: number;
        timestamp: string;
        data: { accessToken: string; user: AuthUser };
      }>(`${this.API_URL}/auth/login`, payload)
      .pipe(
        tap((res) => this.auth.setLogin(res.data.accessToken, res.data.user))
      );
  }

  register(formData: FormData) {
    return this.http
      .post<{ token: string; user: AuthUser }>(
        `${this.API_URL}/auth/register`,
        formData
      )
      .pipe(tap((res) => this.auth.setLogin(res.token, res.user)));
  }

  refreshToken(): Observable<{ token: string }> {
    // Le header Authorization est ajouté par l’interceptor avec l'ancien token
    return this.http.post<{ token: string }>(
      `${this.API_URL}/auth/refresh`,
      {}
    );
  }
}
