import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { GUEST_TOKEN_KEY } from '../services/api';

// Host (zkušební režim): server posílá zbývající sekundy, konec si
// přepočítáme na čas tohoto zařízení.
const withGuestClock = (user) =>
  user?.is_guest ? { ...user, guestEndsAt: Date.now() + (Number(user.guest_seconds_left) || 0) * 1000 } : user;

// Po registraci / přihlášení převede výlety ze zkoušky na nový účet.
// Selhání nevadí — přihlášení platí, jen výlety zůstanou u hosta.
const claimGuestTrips = async (newToken) => {
  const guestToken = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!guestToken || guestToken === newToken) return null;
  try {
    const { movedTrips } = await api.auth.claimGuest(guestToken);
    return movedTrips;
  } catch {
    return null;
  } finally {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  }
};

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
          setUser(withGuestClock(data.user));
        } catch (err) {
          const rejected = err.status === 401 || err.status === 403 || err.status === 404;
          if (!rejected && attempt < 3) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            return loadMe(attempt + 1);
          }
          if (rejected) {
            localStorage.removeItem('journeo_token');
            localStorage.removeItem(GUEST_TOKEN_KEY);
          }
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
    data.claimedTrips = await claimGuestTrips(data.token);
    setUser(data.user);
    return data;
  };

  // Zkušební režim bez registrace: dočasný účet na 3 dny s ukázkovým výletem.
  // { sample: false } — host přichází s vlastním výletem (kopie ze sdílení).
  const startGuest = async ({ sample = true } = {}) => {
    const language = (localStorage.getItem('journeo_lang') || navigator.language || 'cs').slice(0, 2);
    const data = await api.auth.startGuest(language === 'en' ? 'en' : 'cs', sample);
    localStorage.setItem('journeo_token', data.token);
    localStorage.setItem(GUEST_TOKEN_KEY, data.token);
    setUser(withGuestClock(data.user));
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
      data.claimedTrips = await claimGuestTrips(data.token);
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

  const verifyResetCode = async (email, code) => {
    return await api.auth.verifyResetCode(email, code);
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
    data.claimedTrips = await claimGuestTrips(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('journeo_token');
    localStorage.removeItem(GUEST_TOKEN_KEY);
    setUser(null);
  };

  const deleteAccount = async (confirmEmail) => {
    const data = await api.auth.deleteAccount(confirmEmail);
    logout();
    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await api.auth.updateProfile(profileData);
    // Odpověď nenese příznak hosta ani jeho hodiny — zachovej je.
    setUser((prev) => ({ ...prev, ...data.user }));
    return data;
  };

  const isAdmin = user?.role === 'admin';
  const isGuest = Boolean(user?.is_guest);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, checkEmail, verify, resendOtp, forgotPassword, verifyResetCode, resetPassword, changePassword, loginWithGoogle, logout, deleteAccount, updateProfile, isAdmin, isGuest, startGuest }}>
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
