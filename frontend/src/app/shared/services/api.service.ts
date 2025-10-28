import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiListResponse } from '../interfaces/paginated-response';
import { ApiResponse } from '../interfaces/response-formatter';

const SERVER_ERROR_RESPONSE_MAP: Record<number, string> = {
  400: 'Requête invalide. Vérifiez les données envoyées.',
  401: 'Non authentifié. Veuillez vous reconnecter.',
  403: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
  404: 'Ressource non trouvée.',
  409: 'Conflit rencontré.',
  422: 'Données non valides. Vérifiez les champs.',
  429: 'Trop de requêtes. Veuillez patienter.',
  500: 'Erreur serveur interne.',
  502: 'Passerelle incorrecte. Le serveur est temporairement indisponible.',
  503: 'Service temporairement indisponible.',
  504: "Délai d'attente dépassé.",
};
@Injectable({
  providedIn: 'root',
})
export class ApiService<T> {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(data: {
    endpoint: string;
    page?: number;
    limit?: number;
    params?: any;
  }): Observable<ApiListResponse<T>> {
    const { page, limit, params, endpoint } = data;
    const pageQuery = page ?? 1;
    const limitQuery = limit ?? 10;
    const opt = true;
    let httpParams = new HttpParams()
      .set('page', pageQuery.toString())
      .set('limit', limitQuery.toString())
      .set('opt', opt.toString());

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value as string);
        }
      });
    }
    return this.http
      .get<ApiListResponse<T>>(`${this.API_URL}/${endpoint}`, {
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  getOne(endpoint: string, id: number | string): Observable<ApiResponse<T>> {
    return this.http
      .get<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http
      .post<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data)
      .pipe(catchError(this.handleError));
  }

  update(
    endpoint: string,
    id: number,
    data: Partial<T>
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  delete(endpoint: string, id: number | string): Observable<ApiResponse<T>> {
    return this.http
      .delete<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  listAnnouncements(data: {
    categorySlug: string;
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
  }): Observable<ApiListResponse<T>> {
    const { categorySlug, limit, page, filters } = data;
    const pageQuery = page ?? 1;
    const limitQuery = limit ?? 10;
    let params = new HttpParams()
      .set('page', pageQuery.toString())
      .set('limit', limitQuery.toString());
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v == null || v === '' || (Array.isArray(v) && v.length === 0))
          return;
        if (Array.isArray(v))
          v.forEach((val) => (params = params.append(k, String(val))));
        else params = params.set(k, String(v));
      });
    }
    return this.http
      .get<any>(`${this.API_URL}/announcements/${categorySlug}`, {
        params,
      })
      .pipe(catchError(this.handleError));
  }

  getEligibility(announcementId: number) {
    const endpoint = 'users/matching/eligibility';
    return this.http
      .get<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, {
        params: { id: announcementId },
      })
      .pipe(catchError(this.handleError));
  }

  sendMessage(data: any) {
    return this.create('users/messages', data);
  }

  updateProfile(
    endpoint: string,
    data: Partial<T>
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiResponse<any> & { error?: any } = {
      statusCode: 0,
      timestamp: new Date().toISOString(),
      data: {},
    };

    if (error.error instanceof ErrorEvent) {
      apiError = {
        statusCode: 0,
        timestamp: new Date().toISOString(),
        data: { message: error.error.message },
        error: error.error,
      };
    } else {
      apiError.statusCode = error.status;
      apiError.error = error.error;
      const m =
        error.status == 429 ? error.error.error : error.error.data.message;
      const formatResponseMessage = (code: number, errorMessage: string) => {
        const message =
          SERVER_ERROR_RESPONSE_MAP[code] ?? "Contactez l'administrateur.";
        let splitMessage = message.split('.');
        return {
          title: splitMessage[0],
          message: splitMessage[1] || errorMessage,
        };
      };
      const { title, message } = formatResponseMessage(error.status, m);
      SERVER_ERROR_RESPONSE_MAP[error.status] ?? "Contactez l'administrateur";
      apiError.data = { message, title };
    }

    return throwError(() => apiError);
  }
}
