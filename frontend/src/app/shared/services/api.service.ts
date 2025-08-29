import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../interfaces/paginated-response';
import { ApiResponse } from '../interfaces/response-formatter';

@Injectable({
  providedIn: 'root',
})
export class ApiService<T> {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(endpoint: string): Observable<ApiListResponse<T>> {
    return this.http.get<ApiListResponse<T>>(`${this.API_URL}/${endpoint}`);
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
}
