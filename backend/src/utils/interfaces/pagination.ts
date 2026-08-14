import { Order } from "../enums/order.enum";

export interface PaginationParams {
  /** Opaque position in the ordered result set. `page`/OFFSET is deliberately unsupported. */
  cursor?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: Order.ASC | Order.DESC;
  where?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    nextCursor: number | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}
