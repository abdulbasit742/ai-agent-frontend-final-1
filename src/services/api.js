import axios from 'axios';

import { runtimeConfig } from '../config/runtime';
import { tokenManager } from './session';

export const API_BASE_URL = runtimeConfig.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;

function isAuthenticationRequest(config = {}) {
  const url = String(config.url || '');
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

async function refreshAccessToken() {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token is available.');

  const response = await refreshClient.post('/auth/refresh', {}, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const accessToken = response.data?.access_token;
  if (!accessToken) throw new Error('The refresh response did not include an access token.');
  tokenManager.setToken(accessToken);
  return accessToken;
}

api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const canRefresh = error.response?.status === 401
      && !originalRequest._retry
      && !isAuthenticationRequest(originalRequest)
      && tokenManager.getRefreshToken();

    if (!canRefresh) {
      if (error.response?.status === 401 && !isAuthenticationRequest(originalRequest)) {
        tokenManager.clearAll();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const accessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      tokenManager.clearAll();
      return Promise.reject(refreshError);
    }
  },
);

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { access_token: accessToken, refresh_token: refreshToken, user } = response.data || {};

    if (!accessToken || !refreshToken || !user) {
      throw new Error('The login response was incomplete.');
    }

    tokenManager.setToken(accessToken);
    tokenManager.setRefreshToken(refreshToken);
    tokenManager.setUser(user);
    tokenManager.notifyAuthenticated();
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenManager.clearAll();
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data?.user) tokenManager.setUser(response.data.user);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  getAuthStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  },
};

export const tasksAPI = {
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },
  getKanbanData: async () => {
    const response = await api.get('/tasks/kanban');
    return response.data;
  },
  bulkUpdateTasks: async (taskIds, updates) => {
    const response = await api.put('/tasks/bulk-update', { task_ids: taskIds, updates });
    return response.data;
  },
};

export const chatAPI = {
  generateTasks: async (context = {}) => {
    const response = await api.post('/chat/generate-tasks', context);
    return response.data;
  },
  analyzePerformance: async (timeframe = '30 days') => {
    const response = await api.post('/chat/analyze-performance', { timeframe });
    return response.data;
  },
  suggestAssignment: async (taskInfo) => {
    const response = await api.post('/chat/suggest-assignment', { task_info: taskInfo });
    return response.data;
  },
  getServiceStatus: async () => {
    const response = await api.get('/chat/service-status');
    return response.data;
  },
  testServices: async () => {
    const response = await api.post('/chat/test-services');
    return response.data;
  },
};

export const telegramAPI = {
  getStatus: async () => {
    const response = await api.get('/telegram/status');
    return response.data;
  },
  testConnection: async () => {
    const response = await api.post('/telegram/test');
    return response.data;
  },
  sendMessage: async (message, title = 'Custom Message', emoji = '📢') => {
    const response = await api.post('/telegram/send-message', { message, title, emoji });
    return response.data;
  },
  notifyTaskAssignment: async (taskId) => {
    const response = await api.post('/telegram/notify-task-assignment', { task_id: taskId });
    return response.data;
  },
  notifyTaskCompletion: async (taskId) => {
    const response = await api.post('/telegram/notify-task-completion', { task_id: taskId });
    return response.data;
  },
  sendPerformanceReport: async (timeframe = '30 days') => {
    const response = await api.post('/telegram/send-performance-report', { timeframe });
    return response.data;
  },
};

function flattenValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') return null;
  const messages = Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => typeof value === 'string');
  return messages.length ? messages.join(' ') : null;
}

export const apiUtils = {
  handleError: (error) => {
    if (runtimeConfig.configurationError) {
      return { status: 0, message: runtimeConfig.configurationError };
    }

    if (error.response) {
      const { status, data = {} } = error.response;
      const validationMessage = flattenValidationErrors(data.errors);
      const fallbackMessages = {
        401: 'Your session is invalid or has expired. Please sign in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource could not be found.',
        409: 'This change conflicts with existing data.',
        429: 'Too many requests. Please try again shortly.',
      };
      return {
        status,
        message: validationMessage || data.message || fallbackMessages[status] || 'The server could not complete the request.',
      };
    }

    if (error.request) {
      return {
        status: 0,
        message: 'The backend could not be reached. Check the configured API URL and your connection.',
      };
    }

    return {
      status: 0,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  },

  isAuthenticated: () => Boolean(tokenManager.getToken()),
  getCurrentUser: () => tokenManager.getUser(),
  isAdmin: () => tokenManager.getUser()?.role === 'admin',

  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  },

  formatDuration: (hours) => {
    const numericHours = Number(hours);
    if (!Number.isFinite(numericHours) || numericHours <= 0) return '0h';
    if (numericHours < 1) return `${Math.round(numericHours * 60)}m`;
    if (numericHours < 24) {
      const wholeHours = Math.floor(numericHours);
      const minutes = Math.round((numericHours - wholeHours) * 60);
      return minutes ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
    const days = Math.floor(numericHours / 24);
    const remainingHours = Math.round(numericHours % 24);
    return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
  },

  getPriorityEmoji: (priority) => ({ urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[priority] || '🟡'),
  getStatusEmoji: (status) => ({ pending: '⏳', in_progress: '🔄', completed: '✅' }[status] || '⏳'),
};

export { tokenManager };
export default api;
