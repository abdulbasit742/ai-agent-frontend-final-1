import test from 'node:test';
import assert from 'node:assert/strict';

import { createSessionManager } from '../src/services/session.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('migrates legacy localStorage tokens into session storage', () => {
  const session = createMemoryStorage();
  const legacy = createMemoryStorage({ ai_agent_token: 'legacy-token' });
  const manager = createSessionManager(session, legacy);

  assert.equal(manager.getToken(), 'legacy-token');
  assert.equal(legacy.getItem('ai_agent_token'), null);
});

test('returns null for malformed cached user JSON', () => {
  const session = createMemoryStorage({ ai_agent_user: '{broken' });
  const manager = createSessionManager(session);
  assert.equal(manager.getUser(), null);
});

test('stores and clears the full authenticated session', () => {
  const session = createMemoryStorage();
  const manager = createSessionManager(session);

  manager.setToken('access');
  manager.setRefreshToken('refresh');
  manager.setUser({ id: 7, role: 'team' });

  assert.equal(manager.getToken(), 'access');
  assert.deepEqual(manager.getUser(), { id: 7, role: 'team' });

  manager.clearAll({ notify: false });
  assert.equal(manager.getToken(), null);
  assert.equal(manager.getRefreshToken(), null);
  assert.equal(manager.getUser(), null);
});
