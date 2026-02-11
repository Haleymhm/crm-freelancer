import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

/**
 * Cliente HTTP configurado para comunicación con el backend
 * Incluye interceptores para manejo de tokens y errores
 */
class HttpClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
            timeout: 10000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Interceptor para añadir token de autenticación
        this.client.interceptors.request.use(
            (config) => {
                // TODO: Obtener token del storage/context cuando se implemente auth
                // const token = localStorage.getItem('token');
                // if (token) {
                //   config.headers.Authorization = `Bearer ${token}`;
                // }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor para manejo de errores
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                // TODO: Manejo global de errores (401, 403, 500, etc.)
                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }
}

export const httpClient = new HttpClient();
