import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthUser } from '../shared/interfaces/auth';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== AUTH ====================

  loginWithPassword(payload: { email: string; password: string }) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>(`${this.API_URL}/auth/login`, payload, { withCredentials: true });
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
    }>(`${this.API_URL}/auth/activate`, payload, { withCredentials: true });
  }

  refreshToken() {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: any;
    }>(`${this.API_URL}/auth/refresh`, {}, { withCredentials: true });
  }

  // ==================== GOOGLE ====================

  socialVerify(idToken: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { user: AuthUser };
    }>(
      `${this.API_URL}/auth/social/verify`,
      { idToken },
      { withCredentials: true },
    );
  }

  registerWithGoogle(idToken: string) {
    return this.http.post<{
      statusCode: number;
      timestamp: string;
      data: { user: AuthUser };
    }>(
      `${this.API_URL}/auth/register/social`,
      { idToken },
      { withCredentials: true },
    );
  }

  getMe() {
    return this.http.get<{
      statusCode: number;
      timestamp: string;
      data: AuthUser;
    }>(`${this.API_URL}/auth/me`, { withCredentials: true });
  }

  forgotPassword(email: string) {
    return this.http.post(
      `${this.API_URL}/auth/forgot-password`,
      { email },
      { withCredentials: true },
    );
  }

  resetPassword(password: string, token: string) {
    return this.http.post(
      `${this.API_URL}/auth/reset-password`,
      { password, token },
      { withCredentials: true },
    );
  }

  changePassword(password: string) {
    return this.http.put(
      `${this.API_URL}/auth/me/change-password`,
      { password },
      { withCredentials: true },
    );
  }

  logout() {
    return this.http.post(
      `${this.API_URL}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }
}
