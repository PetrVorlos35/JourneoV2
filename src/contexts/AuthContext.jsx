import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('journeo_token');
    if (token) {
      api.auth.me()
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('journeo_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem('journeo_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (firstName, lastName, email, password) => {
    const data = await api.auth.register(firstName, lastName, email, password);
    return data; // No auto-login
  };

  const verify = async (email, code) => {
    return await api.auth.verify(email, code);
  };

  const resendOtp = async (email) => {
    return await api.auth.resendOtp(email);
  };

  const forgotPassword = async (email) => {
    return await api.auth.forgotPassword(email);
  };

  const resetPassword = async (email, code, newPassword) => {
    return await api.auth.resetPassword(email, code, newPassword);
  };

  const changePassword = async (oldPassword, newPassword) => {
    const data = await api.auth.changePassword(oldPassword, newPassword);
    // Změna hesla zneplatní všechny starší tokeny (odhlásí ostatní zařízení);
    // server vrací čerstvý token, kterým udržíme aktuální session přihlášenou.
    if (data.token) {
      localStorage.setItem('journeo_token', data.token);
    }
    return data;
  };

  const loginWithGoogle = async (accessToken) => {
    const data = await api.auth.googleLogin(accessToken);
    localStorage.setItem('journeo_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('journeo_token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const data = await api.auth.updateProfile(profileData);
    setUser(data.user);
    return data;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verify, resendOtp, forgotPassword, resetPassword, changePassword, loginWithGoogle, logout, updateProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider');
  }
  return context;
};
