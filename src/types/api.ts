export type ApiErrorPayload = {
  message: string;
  code?: string;
};

export type ApiResponse<T> = {
  data: T;
};

