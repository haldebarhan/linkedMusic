export interface ApiResponse<T> {
  statusCode: number;
  timestamp: string;
  items: {
    data: T;
    metadata: {
      limit: number;
      hasNext: boolean;
      nextCursor: number | null;
    };
  };
}

export function paginatedResponse<T>(
  statusCode: number,
  items: {
    data: T;
    metadata: {
      limit: number;
      hasNext: boolean;
      nextCursor: number | null;
    };
  }
): ApiResponse<T> {
  return {
    statusCode,
    timestamp: new Date().toISOString(),
    items: items,
  };
}
