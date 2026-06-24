import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error loading user:', err);
        // Keep offline user if token exists, but don't block
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (usernameOrPhone, password) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrPhone, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (fullName, username, phone, password, role = 'member') => {
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // If we are logged in as admin, pass token to allow registering other roles
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fullName, username, phone, password, role }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // If we are registering a member while NOT logged in, auto-login
      if (!token && role === 'member') {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    API_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
