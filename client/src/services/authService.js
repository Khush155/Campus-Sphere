import api from './api';

/**
 * Triggers user authentication against email and password.
 * 
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, user: {id: string, name: string, email: string, role: string, departmentId: string}}>}
 */
export const loginApi = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

/**
 * Logs out current user session on server and client.
 */
export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

let activeRefreshPromise = null;

/**
 * Manually requests a rotated access token using HttpOnly refresh cookies.
 * Deduplicates concurrent calls to prevent double-refresh race conditions (e.g. React Strict Mode).
 */
export const refreshApi = async () => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  localStorage.setItem('auth_refresh_in_progress', 'true');

  activeRefreshPromise = api.post('/auth/refresh')
    .then((response) => {
      activeRefreshPromise = null;
      localStorage.removeItem('auth_refresh_in_progress');
      return response.data.data;
    })
    .catch((err) => {
      activeRefreshPromise = null;
      localStorage.removeItem('auth_refresh_in_progress');
      throw err;
    });

  return activeRefreshPromise;
};

/**
 * Registers a new user account (SUPER_ADMIN and COLLEGE_ADMIN only).
 */
export const registerApi = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data.data;
};

/**
 * Requests a password reset link for the given email.
 */
export const forgotPasswordApi = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Updates user password with new credentials.
 */
export const resetPasswordApi = async (token, password) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

/**
 * Automatically requests user role detection for input confirmation.
 */
export const detectRoleApi = async (identifier) => {
  const response = await api.get(`/auth/detect-role/${encodeURIComponent(identifier)}`);
  return response.data.data;
};

const authService = {
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  detectRoleApi,
};

export default authService;
