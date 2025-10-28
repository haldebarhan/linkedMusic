import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiListResponse } from '../../../shared/interfaces/paginated-response';
import { ApiResponse } from '../../../shared/interfaces/response-formatter';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  constructor(private http: HttpClient) {}

  listResources(data: {
    endpoint: string;
    page?: number;
    limit?: number;
    params?: any;
  }) {
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
    return this.http.get<ApiListResponse<any>>(
      `${environment.apiUrl}/catalog/${endpoint}`,
      { params: httpParams }
    );
  }

  listAdminResources(data: {
    endpoint: string;
    page?: number;
    limit?: number;
    params?: any;
  }) {
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
    return this.http.get<ApiListResponse<any>>(
      `${environment.apiUrl}/admin/catalog/${endpoint}`,
      { params: httpParams }
    );
  }

  findAdminResource(endpoint: string, id: number) {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/admin/catalog/${endpoint}/${id}`
    );
  }

  createResource(endpoint: string, body: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/admin/catalog/${endpoint}`,
      body
    );
  }

  findResource(endpoint: string, id: number) {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/catalog/${endpoint}/${id}`
    );
  }

  updateResource(endpoint: string, id: number, body: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.apiUrl}/admin/catalog/${endpoint}/${id}`,
      body
    );
  }

  removeResource(endpoint: string, id: number) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.apiUrl}/admin/catalog/${endpoint}/${id}`
    );
  }

  listData(data: {
    endpoint: string;
    page?: number;
    limit?: number;
    params?: any;
  }) {
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
    return this.http.get<ApiListResponse<any>>(
      `${environment.apiUrl}/admin/${endpoint}`,
      { params: httpParams }
    );
  }

  postData(endpoint: string, payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/admin/${endpoint}`,
      payload
    );
  }

  updateData(endpoint: string, id: number, body: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.apiUrl}/admin/${endpoint}/${id}`,
      body
    );
  }

  findData(endpoint: string, id: number) {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/admin/${endpoint}/${id}`
    );
  }

  removeData(endpoint: string, id: number) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.apiUrl}/admin/${endpoint}/${id}`
    );
  }
}
