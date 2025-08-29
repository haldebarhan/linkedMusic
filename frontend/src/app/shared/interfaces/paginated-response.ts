export interface ApiListResponse<T> {
    statusCode: number;
    timestamp: string;
    items: {
        data: T[],
        metadata: {
            total: number,
            page: number,
            totalPage: number
        }
    }
}