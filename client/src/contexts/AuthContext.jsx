/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logoutApi, refreshApi } from '../services/authService';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campussphere_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });

  const [loading, setLoading] = useState(true);

  // Helper to process login response data
  const handleAuthSuccess = (accessToken, userData) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    setUser((prev) => {
      const merged = { ...prev, ...userData };
      try {
        localStorage.setItem('campussphere_user', JSON.stringify(merged));
      } catch (e) {
        // Ignored
      }
      return merged;
    });
    setIsAuthenticated(true);
  };

  // Helper to clear local session state
  const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('campussphere_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Perform initial session recovery on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await refreshApi();
        let userData = data.user || decodeTokenPayload(data.accessToken);

        // If user object is missing name, fetch full profile from /users/me
        if (userData && !userData.name) {
          try {
            const profileRes = await api.get('/users/me');
            if (profileRes.data?.data) {
              userData = { ...userData, ...profileRes.data.data };
            }
          } catch (e) {
            // Ignored
          }
        }

        handleAuthSuccess(data.accessToken, userData);
      } catch (error) {
        // Session cannot be restored automatically, clear any stale localStorage
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for unauthorized events emitted by Axios interceptor
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (accessToken, userData) => {
    handleAuthSuccess(accessToken, userData);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch (error) {
      // Proceed with local logout even if server-side cookie deletion fails
    } finally {
      clearSession();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper utility to decode JWT base64 payload without external library dependencies
function decodeTokenPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export default AuthContext;
