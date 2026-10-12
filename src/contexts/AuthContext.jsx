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
      // Token mažeme jen když ho server odmítne. Výpadek sítě nebo restart
      // API (fetch bez odpovědi, 5xx) nesmí uživatele odhlásit — zkusíme
      // to ještě párkrát.
      const loadMe = async (attempt = 0) => {
        try {
          const data = await api.auth.me();
          setUser(data.user);
        } catch (err) {
          const rejected = err.status === 401 || err.status === 403 || err.status === 404;
          if (!rejected && attempt < 3) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            return loadMe(attempt + 1);
          }
          if (rejected) localStorage.removeItem('journeo_token');
          setUser(null);
        }
      };
      loadMe().finally(() => setLoading(false));
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

  const checkEmail = async (email) => {
    return await api.auth.checkEmail(email);
  };

  // Ověření kódu z registrace rovnou přihlašuje (server vrací token).
  const verify = async (email, code) => {
    const data = await api.auth.verify(email, code);
    if (data.token) {
      localStorage.setItem('journeo_token', data.token);
      setUser(data.user);
    }
    return data;
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

  const deleteAccount = async (confirmEmail) => {
    const data = await api.auth.deleteAccount(confirmEmail);
    logout();
    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await api.auth.updateProfile(profileData);
    setUser(data.user);
    return data;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, checkEmail, verify, resendOtp, forgotPassword, resetPassword, changePassword, loginWithGoogle, logout, deleteAccount, updateProfile, isAdmin }}>
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
