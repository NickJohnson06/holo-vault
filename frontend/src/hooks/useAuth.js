import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check local storage
  useEffect(() => {
    const savedToken = localStorage.getItem('hv_token');
    const savedUsername = localStorage.getItem('hv_username');
    const savedUserId = localStorage.getItem('hv_user_id');

    if (savedToken && savedUsername && savedUserId) {
      const activeUser = {
        token: savedToken,
        username: savedUsername,
        id: parseInt(savedUserId, 10),
      };
      setUser(activeUser);
      // Inject bearer token into axios standard headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const params = new URLSearchParams();
      // OAuth2 request expects 'username' (which can be email or username in our backend) and 'password'
      params.append('username', username);
      params.append('password', password);

      const res = await axios.post(`${API_BASE}/auth/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, user_id, username: returnedUsername } = res.data;

      localStorage.setItem('hv_token', access_token);
      localStorage.setItem('hv_username', returnedUsername);
      localStorage.setItem('hv_user_id', user_id.toString());

      const loggedInUser = {
        token: access_token,
        username: returnedUsername,
        id: user_id,
      };

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(detail);
      throw new Error(detail);
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      // Create account
      await axios.post(`${API_BASE}/auth/register`, {
        username,
        email,
        password,
      });

      // Auto-login after registration
      return await login(username, password);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Registration failed. Email or Username might be taken.';
      setError(detail);
      throw new Error(detail);
    }
  };

  const handleOAuthLogin = (token, username, userId) => {
    localStorage.setItem('hv_token', token);
    localStorage.setItem('hv_username', username);
    localStorage.setItem('hv_user_id', userId.toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({
      token,
      username,
      id: parseInt(userId, 10),
    });
  };

  const logout = () => {
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_username');
    localStorage.removeItem('hv_user_id');
    
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setError,
    handleOAuthLogin
  };
}

