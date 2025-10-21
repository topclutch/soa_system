import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG } from "../config/constants";
import toast from "react-hot-toast";

// --- TYPE DEFINITIONS ---

// Custom type for requests that may be retried after a token refresh.
export type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Type for the queue of failed requests waiting for a new token.
type FailedRequestQueueItem = {
  resolve: (config: InternalAxiosRequestConfig) => void;
  reject: (error: any) => void;
  config: RetryConfig;
};

// --- STATE AND HELPERS ---

let isRefreshing = false;
let failedQueue: FailedRequestQueueItem[] = [];

/**
 * Helper to get and clean the token from localStorage.
 * Handles cases where the token might be stored with extra quotes.
 */
const getToken = (): string | null => {
  const token = localStorage.getItem("token");
  return token ? token.replace(/^"(.*)"$/, "$1").trim() : null;
};

/**
 * Helper to set the token in localStorage.
 */
const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

/**
 * Clears user session data and redirects to the login page.
 */
const clearSessionAndRedirect = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
  // Use a small delay to allow the toast to be seen before redirecting.
  setTimeout(() => {
    window.location.href = "/login?session_expired=1";
  }, 500);
};

/**
 * Processes the queue of failed requests after a token refresh attempt.
 * @param error - The error object if the refresh failed.
 * @param token - The new token if the refresh was successful.
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (token) {
      // Attach the new token to the headers of the failed request and retry it.
      config.headers.set("Authorization", `Bearer ${token}`);
      resolve(config);
    }
  });
  failedQueue = [];
};

// --- AXIOS INSTANCE FACTORY ---

/**
 * Creates a configured Axios instance with interceptors for token management.
 * @param baseURL - The base URL for the API endpoint.
 */
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // --- REQUEST INTERCEPTOR ---
  instance.interceptors.request.use(
    (config: RetryConfig) => {
      const token = getToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
      // Optional: Add logging for development if needed
      // console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error("❌ REQUEST ERROR:", error);
      return Promise.reject(error);
    },
  );

  // --- RESPONSE INTERCEPTOR ---
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (err: AxiosError) => {
      const originalRequest = err.config as RetryConfig;

      // Only handle 401 errors that are not on auth routes and haven't been retried.
      if (err.response?.status === 401 && originalRequest && !originalRequest._retry) {
        // Do not attempt refresh for authentication endpoints (like login/register).
        if (originalRequest.url?.includes("/auth/")) {
          return Promise.reject(err);
        }

        if (isRefreshing) {
          // If a refresh is already in progress, queue the failed request.
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest });
          }).then((config) => instance(config)); // Retry the request once the promise resolves.
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const currentToken = getToken();
        if (!currentToken) {
          isRefreshing = false;
          clearSessionAndRedirect();
          return Promise.reject(err);
        }

        try {
          console.log("🔄 Attempting token refresh...");
          // Use a separate, clean axios call for the refresh token endpoint.
          const refreshResponse = await axios.post(
            `${API_CONFIG.BACKEND1_URL}/api/auth/refresh-token`,
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } },
          );

          const { token: newToken } = refreshResponse.data;
          if (!newToken) throw new Error("No new token received from refresh endpoint.");
          
          console.log("✅ Token refreshed successfully.");
          setToken(newToken);
          
          // Update the default headers for subsequent requests.
          instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          
          // Process the queue with the new token.
          processQueue(null, newToken);

          // Retry the original failed request with the new token.
          return instance(originalRequest);

        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
          processQueue(refreshError, null);
          clearSessionAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(err);
    },
  );

  return instance;
};

// --- EXPORTED INSTANCES AND ERROR HANDLER ---

export const backend1Api = createApiInstance(API_CONFIG.BACKEND1_URL);
export const backend2Api = createApiInstance(API_CONFIG.BACKEND2_URL);

/**
 * A centralized utility to parse API errors and return a user-friendly message.
 * @param err - The error object, typically from a catch block.
 * @returns A user-friendly error string.
 */
export const handleApiError = (err: any): string => {
  if (!axios.isAxiosError(err)) {
    console.error("❓ Unknown error type:", err);
    return "Ocurrió un error desconocido.";
  }

  const status = err.response?.status;
  const data = err.response?.data;

  console.error("🔍 HANDLING API ERROR:", {
    status,
    data,
    url: `${err.config?.method?.toUpperCase()} ${err.config?.url}`,
  });

  switch (status) {
    case 400: {
      // Handle complex validation errors from the backend.
      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          return data.errors.join(", ");
        }
        if (typeof data.errors === 'object') {
          return Object.values(data.errors).flat().join("; ");
        }
      }
      // Handle simple message errors.
      if (data?.message) {
        if (data.message.includes("duplicate") || data.message.includes("unique")) {
          return "Ya existe un registro con estos datos.";
        }
        return data.message;
      }
      return "La solicitud es inválida. Por favor, revisa los datos enviados.";
    }
    case 401:
      return "Sesión expirada. Por favor, inicia sesión nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "El recurso solicitado no fue encontrado.";
    case 422:
      return "Los datos enviados son inválidos o están incompletos.";
    case 500:
    case 501:
    case 502:
    case 503:
      return "El servidor encontró un problema. Por favor, intenta más tarde.";
    default:
      return err.message || "Error de conexión. Revisa tu red e intenta de nuevo.";
  }
};
