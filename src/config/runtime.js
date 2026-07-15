const LOCAL_API_URL = 'http://localhost:5000/api';

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, '');
}

function normalizeHttpUrl(value, { appendApi = false } = {}) {
  const candidate = String(value || '').trim();
  if (!candidate) return null;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('The configured API URL is not a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('The configured API URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error('Credentials must not be embedded in the API URL.');
  }

  url.hash = '';
  url.search = '';
  let normalized = trimTrailingSlashes(url.toString());
  if (appendApi && !normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
}

export function resolveApiBaseUrl(env = {}, locationLike = {}) {
  const explicitApiUrl = env.VITE_API_URL || env.VITE_API_BASE_URL;
  if (explicitApiUrl) {
    return normalizeHttpUrl(explicitApiUrl);
  }

  if (env.VITE_BACKEND_URL) {
    return normalizeHttpUrl(env.VITE_BACKEND_URL, { appendApi: true });
  }

  const hostname = String(locationLike.hostname || '').toLowerCase();
  const origin = String(locationLike.origin || '').trim();
  const isLocal = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal) return LOCAL_API_URL;
  if (origin) return `${trimTrailingSlashes(origin)}/api`;
  return LOCAL_API_URL;
}

export function createRuntimeConfig(env = {}, locationLike = {}) {
  try {
    return {
      apiBaseUrl: resolveApiBaseUrl(env, locationLike),
      configurationError: null,
    };
  } catch (error) {
    return {
      apiBaseUrl: LOCAL_API_URL,
      configurationError: error instanceof Error ? error.message : 'Invalid API configuration.',
    };
  }
}

const browserLocation = typeof window === 'undefined' ? {} : window.location;

export const runtimeConfig = createRuntimeConfig(import.meta.env, browserLocation);
