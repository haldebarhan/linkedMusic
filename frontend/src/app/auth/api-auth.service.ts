import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthUser } from '../shared/interfaces/auth';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  loginWithPassword(payload: { email: string; password: string }) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>(`${this.API_URL}/auth/login`, payload);
  }

  register(formData: FormData) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${this.API_URL}/auth/register`, formData);
  }

  activateAccount(payload: { email: string; token: string }) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>(`${this.API_URL}/auth/activate`, payload);
  }

  refreshToken(): Observable<{ token: string }> {
    // Le header Authorization est ajouté par l’interceptor avec l'ancien token
    return this.http.post<{ token: string }>(
      `${this.API_URL}/auth/refresh`,
      {}
    );
  }

  socialVerify(idToken: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>(
      `${environment.apiUrl}/auth/social/verify`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
  }

  registerWithGoogle(idToken: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>(
      `${environment.apiUrl}/auth/register/social`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
  }

  getMe() {
    return this.http.get<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${environment.apiUrl}/auth/me`);
  }

  changePassword(password: string) {
    return this.http.put<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${environment.apiUrl}/auth/me/change-password`, { password });
  }

  forgotPassword(email: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(password: string, token: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${environment.apiUrl}/auth/reset-password`, { password, token });
  }
}
