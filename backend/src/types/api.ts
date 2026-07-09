// ─────────────────────────────────────────────────────
// Shared API response envelope types
// ─────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    cached: boolean;
    timestamp: number;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    timestamp: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
