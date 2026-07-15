const STORAGE_KEYS = {
  accessToken: 'ai_agent_token',
  refreshToken: 'ai_agent_refresh_token',
  user: 'ai_agent_user',
};

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function emitSessionEvent(type) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(type));
  }
}

export function createSessionManager(storage, legacyStorage = null) {
  const selectedStorage = storage;

  const migrateLegacyValue = (key) => {
    if (!selectedStorage || !legacyStorage || selectedStorage.getItem(key)) return;
    const legacyValue = legacyStorage.getItem(key);
    if (legacyValue) {
      selectedStorage.setItem(key, legacyValue);
      legacyStorage.removeItem(key);
    }
  };

  Object.values(STORAGE_KEYS).forEach(migrateLegacyValue);

  return {
    getToken: () => selectedStorage?.getItem(STORAGE_KEYS.accessToken) || null,
    setToken: (token) => {
      if (token) selectedStorage?.setItem(STORAGE_KEYS.accessToken, token);
      else selectedStorage?.removeItem(STORAGE_KEYS.accessToken);
    },
    getRefreshToken: () => selectedStorage?.getItem(STORAGE_KEYS.refreshToken) || null,
    setRefreshToken: (token) => {
      if (token) selectedStorage?.setItem(STORAGE_KEYS.refreshToken, token);
      else selectedStorage?.removeItem(STORAGE_KEYS.refreshToken);
    },
    getUser: () => safeParse(selectedStorage?.getItem(STORAGE_KEYS.user)),
    setUser: (user) => {
      if (user) selectedStorage?.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      else selectedStorage?.removeItem(STORAGE_KEYS.user);
    },
    clearAll: ({ notify = true } = {}) => {
      Object.values(STORAGE_KEYS).forEach((key) => selectedStorage?.removeItem(key));
      if (notify) emitSessionEvent('auth:expired');
    },
    notifyAuthenticated: () => emitSessionEvent('auth:changed'),
  };
}

const browserSessionStorage = typeof window === 'undefined' ? null : window.sessionStorage;
const browserLocalStorage = typeof window === 'undefined' ? null : window.localStorage;

export const tokenManager = createSessionManager(browserSessionStorage, browserLocalStorage);
