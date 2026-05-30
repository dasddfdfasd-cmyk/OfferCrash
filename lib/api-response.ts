export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    status: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(
  message: string,
  status = 500,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      status,
    },
  };
}
