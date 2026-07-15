import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeConfig, resolveApiBaseUrl } from '../src/config/runtime.js';

test('prefers VITE_API_URL and removes trailing slashes', () => {
  assert.equal(
    resolveApiBaseUrl({ VITE_API_URL: 'https://api.example.com/api///' }),
    'https://api.example.com/api',
  );
});

test('supports the legacy VITE_API_BASE_URL variable', () => {
  assert.equal(
    resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://legacy.example.com/api' }),
    'https://legacy.example.com/api',
  );
});

test('appends /api to VITE_BACKEND_URL', () => {
  assert.equal(
    resolveApiBaseUrl({ VITE_BACKEND_URL: 'https://backend.example.com/' }),
    'https://backend.example.com/api',
  );
});

test('uses same-origin API outside local development', () => {
  assert.equal(
    resolveApiBaseUrl({}, { hostname: 'app.example.com', origin: 'https://app.example.com' }),
    'https://app.example.com/api',
  );
});

test('rejects credentials embedded in a URL without crashing the app config', () => {
  const config = createRuntimeConfig({ VITE_API_URL: 'https://user:pass@example.com/api' });
  assert.equal(config.apiBaseUrl, 'http://localhost:5000/api');
  assert.match(config.configurationError, /Credentials/);
});
