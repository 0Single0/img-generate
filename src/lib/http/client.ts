import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorPayload } from "@/types/api";

export const httpClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const locale = typeof document === "undefined"
    ? undefined
    : document.documentElement.lang;

  config.headers.set("x-client", "image-console");

  if (locale) {
    config.headers.set("x-locale", locale);
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Request failed unexpectedly";

    return Promise.reject(new Error(message));
  },
);

export const apiGet = async <T>(url: string, config?: AxiosRequestConfig) => {
  const response = await httpClient.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
) => {
  const response = await httpClient.post<T>(url, body, config);
  return response.data;
};

export const apiPatch = async <T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
) => {
  const response = await httpClient.patch<T>(url, body, config);
  return response.data;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig) => {
  const response = await httpClient.delete<T>(url, config);
  return response.data;
};

