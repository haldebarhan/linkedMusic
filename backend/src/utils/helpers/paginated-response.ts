export interface ApiResponse<T> {
  statusCode: number;
  timestamp: string;
  items: {
    data: T;
    metadata: {
      total: number;
      page: number;
      totalPage: number;
    };
  };
}

export function paginatedResponse<T>(
  statusCode: number,
  items: {
    data: T;
    metadata: {
      total: number;
      page: number;
      totalPage: number;
    };
  }
): ApiResponse<T> {
  return {
    statusCode,
    timestamp: new Date().toISOString(),
    items: items,
  };
}