export interface ApiListResponse<T> {
    statusCode: number;
    timestamp: string;
    items: {
        data: T[],
        metadata: {
            limit: number,
            hasNext: boolean,
            nextCursor: number | null,
            /** Legacy UI value; the cursor API does not compute a total. */
            total: number,
            /** UI-only values derived from cursor navigation; not backend totals. */
            page: number,
            totalPage: number
        }
    }
}

export interface CursorPageParams {
    cursor?: number;
    limit?: number;
}
