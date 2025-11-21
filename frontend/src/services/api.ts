import type {
  Project,
  Session,
  Message,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
  ApiResponse,
} from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Request: ${options?.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    console.log(`API Response: ${response.status} ${response.statusText}`);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('API Error:', errorData);
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('API Data:', data);
    return data;
  } catch (error) {
    console.error('Network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Projects API
export const projectsAPI = {
  getAll: () => fetchAPI<Project[]>('/projects'),
  getById: (id: string) => fetchAPI<Project>(`/projects/${id}`),
  create: (data: CreateProjectRequest) =>
    fetchAPI<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateProjectRequest) =>
    fetchAPI<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI<null>(`/projects/${id}`, {
      method: 'DELETE',
    }),
  getSessions: (id: string) => fetchAPI<Session[]>(`/projects/${id}/sessions`),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => fetchAPI<Session[]>('/sessions'),
  getById: (id: string) => fetchAPI<Session>(`/sessions/${id}`),
  create: (data: CreateSessionRequest) =>
    fetchAPI<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateSessionRequest) =>
    fetchAPI<Session>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI<null>(`/sessions/${id}`, {
      method: 'DELETE',
    }),
  getMessages: (id: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<Message[]>(`/sessions/${id}/messages${query}`);
  },
};

// Health check
export const healthAPI = {
  check: () => fetchAPI<{ status: string; timestamp: string }>('/health'),
};
