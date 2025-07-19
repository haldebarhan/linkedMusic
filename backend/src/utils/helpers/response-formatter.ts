export interface ApiResponse<T> {
  statusCode: number;
  timestamp: string;
  data: T;
}

export function formatResponse<T>(statusCode: number, data: T): ApiResponse<T> {
  return {
    statusCode,
    timestamp: new Date().toISOString(),
    data,
  };
}
