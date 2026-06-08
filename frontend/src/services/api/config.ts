import { createClient } from '@/utils/supabase/client';

class APIClient {
  private baseUrl: string;
  private timeout: number;
  private retryCount: number;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL as string, timeout: number = 10000, retryCount: number = 3) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryCount = retryCount;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: {
      body?: Record<string, any>;
      params?: Record<string, string | number>;
      headers?: Record<string, string>;
      requiresAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { body, params, headers = {}, requiresAuth = true } = options;

    let url = this.buildUrl(endpoint, params);
    const token = await this.getAuthToken();

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requiresAuth && token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: defaultHeaders,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.detail || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new APIError('No se puede conectar al servidor', 503);
      }
      throw new APIError(error instanceof Error ? error.message : 'Error desconocido', 500);
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    let url = endpoint;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, String(value));
      });
    }
    return `${this.baseUrl}${url}`;
  }

  get<T>(endpoint: string, options?: Parameters<typeof this.request>[2]) {
    return this.request<T>('GET', endpoint, options);
  }

  post<T>(endpoint: string, body?: Record<string, any>, options?: Omit<Parameters<typeof this.request>[2], 'body'>) {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  put<T>(endpoint: string, body?: Record<string, any>, options?: Omit<Parameters<typeof this.request>[2], 'body'>) {
    return this.request<T>('PUT', endpoint, { ...options, body });
  }

  delete<T>(endpoint: string, options?: Parameters<typeof this.request>[2]) {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const apiClient = new APIClient();
