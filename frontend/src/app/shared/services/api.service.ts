import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, from, map, Observable, tap } from 'rxjs';
import { ApiListResponse } from '../interfaces/paginated-response';
import { ApiResponse } from '../interfaces/response-formatter';
import { AnnouncementSearchParams } from '../interfaces/annoncement';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthUser } from '../interfaces/auth';

@Injectable({
  providedIn: 'root',
})
export class ApiService<T = unknown> {
  private API_URL = environment.apiUrl;
  /** Temporary UI page numbers mapped to backend cursors; never sent to the API. */
  private readonly cursorByPage = new Map<
    string,
    Map<number, number | undefined>
  >();

  constructor(
    private http: HttpClient,
    private queryClient: QueryClient,
  ) {}

  /** The only class allowed to execute HTTP calls in the frontend. */
  request<R>(
    method: string,
    endpoint: string,
    options: any = {},
  ): Observable<R> {
    // Angular's `request` overload cannot infer a body response when callers use
    // event options (e.g. upload progress). Keep that boundary typed here.
    return this.http.request(method, `${this.API_URL}/${endpoint}`, {
      withCredentials: true,
      ...options,
    }) as Observable<R>;
  }

  // Authentication endpoints remain here so HttpClient is only used by this class.
  loginWithPassword(payload: { email: string; password: string }) {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>('POST', 'auth/login', { body: payload });
  }

  register(formData: FormData) {
    return this.request<{ statusCode: number; timestamp: string; data: any }>(
      'POST',
      'auth/register',
      { body: formData },
    );
  }

  activateAccount(payload: { email: string; token: string }) {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string; user: AuthUser };
    }>('POST', 'auth/activate', { body: payload });
  }

  refreshToken() {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: { accessToken: string };
    }>('POST', 'auth/refresh', { body: {} });
  }

  socialVerify(idToken: string) {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: { user: AuthUser; accessToken?: string };
    }>('POST', 'auth/social/verify', { body: { idToken } });
  }
  registerWithGoogle(idToken: string) {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: { user: AuthUser };
    }>('POST', 'auth/register/social', { body: { idToken } });
  }
  getMe() {
    return this.request<{
      statusCode: number;
      timestamp: string;
      data: AuthUser;
    }>('GET', 'auth/me');
  }
  forgotPassword(email: string) {
    return this.request('POST', 'auth/forgot-password', { body: { email } });
  }
  resetPassword(password: string, token: string) {
    return this.request('POST', 'auth/reset-password', {
      body: { password, token },
    });
  }
  changePassword(password: string) {
    return this.request('PUT', 'auth/me/change-password', {
      body: { password },
    });
  }
  logout() {
    return this.request('POST', 'auth/logout', { body: {} });
  }

  private cachedGet<R>(
    key: readonly unknown[],
    endpoint: string,
    options: any = {},
  ): Observable<R> {
    return from(
      this.queryClient.fetchQuery({
        queryKey: key,
        queryFn: () =>
          firstValueFrom(this.request<R>('GET', endpoint, options)),
        staleTime: 30_000,
      }),
    );
  }

  invalidate(...key: string[]): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: key });
  }

  getAll(data: {
    endpoint: string;
    cursor?: number | null;
    /** @deprecated UI-only compatibility while list screens use previous/next controls. */
    params?: any;
  }): Observable<ApiListResponse<T>> {
    const { cursor, params, endpoint } = data;
    // const opt = true;
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value as string);
        }
      });
    }
    const paginationKey = `${endpoint}?${httpParams.toString()}`;
    const resolvedCursor = cursor ?? this.cursorForPage(paginationKey);
    if (resolvedCursor)
      httpParams = httpParams.set('cursor', resolvedCursor.toString());

    return this.cachedGet<ApiListResponse<T>>(
      ['api', endpoint, httpParams.toString()],
      endpoint,
      { params: httpParams },
    ).pipe(map((response) => this.recordCursorPage(response, paginationKey)));
  }

  private cursorForPage(key: string, page?: number): number | undefined {
    if (!page || page <= 1) {
      this.cursorByPage.set(key, new Map([[1, undefined]]));
      return undefined;
    }
    return this.cursorByPage.get(key)?.get(page);
  }

  private recordCursorPage<R extends ApiListResponse<any>>(
    response: R,
    key: string,
    page?: number,
  ): R {
    if (!page) return response;
    const metadata = response.items?.metadata;
    if (!metadata) return response;
    const cursors =
      this.cursorByPage.get(key) ?? new Map<number, number | undefined>();
    cursors.set(page, cursors.get(page));
    if (metadata.hasNext && metadata.nextCursor)
      cursors.set(page + 1, metadata.nextCursor);
    this.cursorByPage.set(key, cursors);

    // Legacy templates can still show a sequential page number, without pretending
    // that the backend knows an expensive total count.
    (metadata as any).page = page;
    (metadata as any).totalPage = metadata.hasNext ? page + 1 : page;
    (metadata as any).total = (metadata as any).total ?? 0;
    return response;
  }

  getOne(endpoint: string, id: number | string): Observable<ApiResponse<T>> {
    return this.cachedGet<ApiResponse<T>>(
      ['api', endpoint, id],
      `${endpoint}/${id}`,
    );
  }

  create(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('POST', endpoint, { body: data }).pipe(
      tap(() => void this.invalidate('api', endpoint)),
    );
  }

  update(
    endpoint: string,
    id: number,
    data: Partial<T>,
  ): Observable<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PUT', `${endpoint}/${id}`, {
      body: data,
    }).pipe(tap(() => void this.invalidate('api', endpoint)));
  }

  delete(endpoint: string, id?: number | string): Observable<ApiResponse<T>> {
    const fullEndpoint = id ? `${endpoint}/${id}` : endpoint;
    return this.request<ApiResponse<T>>('DELETE', fullEndpoint).pipe(
      tap(() => void this.invalidate('api', endpoint)),
    );
  }

  listAnnouncements(data: {
    categorySlug: string;
    cursor?: number;
    limit?: number;
    filters?: Record<string, any>;
  }): Observable<ApiListResponse<T>> {
    const { categorySlug, limit, cursor, filters } = data;
    const limitQuery = limit ?? 10;
    let params = new HttpParams().set('limit', limitQuery.toString());
    if (cursor) params = params.set('cursor', cursor.toString());
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v == null || v === '' || (Array.isArray(v) && v.length === 0))
          return;
        if (Array.isArray(v))
          v.forEach((val) => (params = params.append(k, String(val))));
        else params = params.set(k, String(v));
      });
    }
    return this.cachedGet<any>(
      ['api', 'announcements', categorySlug, params.toString()],
      `announcements/${categorySlug}`,
      { params },
    );
  }

  getDashboard() {
    return this.cachedGet<ApiResponse<any>>(
      ['api', 'users', 'dashboard'],
      'users/dashboard',
    );
  }

  getEligibility(announcementId: number) {
    const endpoint = 'users/matching/eligibility';
    return this.cachedGet<ApiResponse<T>>(
      ['api', endpoint, announcementId],
      endpoint,
      {
        params: { id: announcementId },
      },
    );
  }

  sendMessage(data: any) {
    return this.create('users/messages', data);
  }

  updateProfile(
    endpoint: string,
    data: Partial<T>,
  ): Observable<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PUT', endpoint, { body: data }).pipe(
      tap(() => void this.invalidate('api', endpoint)),
    );
  }

  // ============================================================================
  // NEW API
  // ============================================================================

  searchAnnouncements(
    params: AnnouncementSearchParams,
  ): Observable<ApiListResponse<T>> {
    const cleanParams: Record<string, any> = {};
    Object.keys(params).forEach((key) => {
      const value = (params as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    const httpParams = new HttpParams({ fromObject: cleanParams });
    return this.cachedGet<ApiListResponse<any>>(
      ['api', 'announcements', 'search', httpParams.toString()],
      'announcements/search',
      { params: httpParams },
    );
  }

  getUserTransactions(data: {
    status: string;
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
    cursor?: number;
    page?: number;
    limit?: number;
  }) {
    const { limit, cursor, page, sortBy, sortOrder, status } = data;
    const limitQuery = limit ?? 10;
    let params = new HttpParams()
      .set('limit', limitQuery.toString())
      .set('sortBy', sortBy ?? 'date')
      .set('status', status.toUpperCase())
      .set('sortOrder', sortOrder ?? 'desc');

    const paginationKey = `users/payments?${params.toString()}`;
    const resolvedCursor = cursor ?? this.cursorForPage(paginationKey, page);
    if (resolvedCursor)
      params = params.set('cursor', resolvedCursor.toString());
    return this.cachedGet<ApiListResponse<any>>(
      ['api', 'users', 'payments', params.toString()],
      'users/payments',
      { params },
    ).pipe(
      map((response) => this.recordCursorPage(response, paginationKey, page)),
    );
  }

  sendTrimVideoRequest(data: any) {
    return this.request<any>('POST', 'users/trimm-video', {
      body: data,
      reportProgress: true,
      observe: 'events',
      responseType: 'blob' as any,
    });
  }

  // Admin and catalogue endpoints (previously duplicated in ApiService).
  listResources(data: {
    endpoint: string;
    cursor?: number | null;
    page?: number;
    limit?: number;
    params?: any;
  }) {
    return this.getAll({ ...data, endpoint: `catalog/${data.endpoint}` });
  }
  listAdminResources(data: {
    endpoint: string;
    cursor?: number | null;
    page?: number;
    limit?: number;
    params?: any;
  }) {
    return this.getAll({ ...data, endpoint: `admin/catalog/${data.endpoint}` });
  }
  findAdminResource(endpoint: string, id: number) {
    return this.getOne(`admin/catalog/${endpoint}`, id);
  }
  createResource(endpoint: string, body: any) {
    return this.create(`admin/catalog/${endpoint}`, body);
  }
  findResource(endpoint: string, id: number) {
    return this.getOne(`admin/catalog/${endpoint}`, id);
  }
  updateResource(endpoint: string, id: number, body: any) {
    return this.update(`admin/catalog/${endpoint}`, id, body);
  }
  removeResource(endpoint: string, id: number) {
    return this.delete(`admin/catalog/${endpoint}`, id);
  }
  listData(data: {
    endpoint: string;
    cursor?: number;
    page?: number;
    limit?: number;
    params?: any;
  }) {
    return this.getAll({ ...data, endpoint: `admin/${data.endpoint}` });
  }
  postData(endpoint: string, payload: any) {
    return this.create(`admin/${endpoint}`, payload);
  }
  updateData(endpoint: string, id: number, body: any) {
    return this.update(`admin/${endpoint}`, id, body);
  }
  findData(endpoint: string, id: number) {
    return this.getOne(`admin/${endpoint}`, id);
  }
  removeData(endpoint: string, id: number) {
    return this.delete(`admin/${endpoint}`, id);
  }
}
