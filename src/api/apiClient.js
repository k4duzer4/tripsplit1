import { t } from '@/lib/i18n';
const viteMeta = /** @type {any} */ (import.meta);
const API_URL = viteMeta.env?.VITE_API_URL || '';
const TOKEN_KEY = 'tripsplit_access_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).catch(() => { throw new Error(t('Não foi possível conectar. Verifique sua conexão.')); });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const failure = Object.assign(
      new Error(t(payload.error || 'Não foi possível concluir a operação.')),
      { status: response.status },
    );
    throw failure;
  }
  return payload;
}

function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

const auth = {
  me: () => request('/api/auth/me'),
  isAuthenticated: async () => {
    try {
      await auth.me();
      return true;
    } catch {
      return false;
    }
  },
  register: ({ email, password }) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyOtp: async ({ email, otpCode }) => {
    const result = await request('/api/auth/verify', { method: 'POST', body: JSON.stringify({ email, otpCode }) });
    saveToken(result.access_token);
    return result;
  },
  resendOtp: ({ email }) => request('/api/auth/resend', { method: 'POST', body: JSON.stringify({ email }) }),
  loginViaEmailPassword: async (email, password) => {
    const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveToken(result.access_token);
    return result;
  },
  setToken: saveToken,
  logout: async (redirectTo) => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // The local token must still be cleared if the session already expired.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      if (redirectTo) window.location.href = redirectTo === true ? '/login' : redirectTo;
    }
  },
  redirectToLogin: (returnTo = '/') => {
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  },
  resetPasswordRequest: ({ email }) => request('/api/auth/reset-request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: ({ resetToken, newPassword }) => request('/api/auth/reset', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) }),
};

export const api = { auth, request };
export default api;
