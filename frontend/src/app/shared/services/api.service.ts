import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../interfaces/paginated-response';
import { ApiResponse } from '../interfaces/response-formatter';

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
    let httpParams = new HttpParams()
      .set('page', pageQuery.toString())
      .set('limit', limitQuery.toString());

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value as string);
        }
      });
    }
    return this.http.get<ApiListResponse<T>>(`${this.API_URL}/${endpoint}`, {
      params: httpParams,
    });
  }

  getOne(endpoint: string, id: number): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`);
  }

  create(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data);
  }

  update(
    endpoint: string,
    id: number,
    data: Partial<T>
  ): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(
      `${this.API_URL}/${endpoint}/${id}`,
      data
    );
  }

  delete(endpoint: string, id: number | string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(
      `${this.API_URL}/${endpoint}/${id}`
    );
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
    return this.http.get<any>(`${this.API_URL}/announcements/${categorySlug}`, {
      params,
    });
  }
}
