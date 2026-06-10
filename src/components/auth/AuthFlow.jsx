import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import JourneoWhiteLogo from '../../assets/Journeo_whitelogo.png';
import JourneoBlackLogo from '../../assets/Journeo_blacklogo.png';
import GoogleIcon from '../../assets/google.png';

const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  return strength;
};

const AuthFlow = () => {
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, verify, resendOtp, forgotPassword, resetPassword } = useAuth();

  const googleLoginFn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setErrorMsg('');
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.success(mode === 'login' ? 'Vítejte zpět!' : 'Registrace úspěšná! Vítejte v Journeo.');
        navigate('/dashboard');
      } catch (err) {
        setErrorMsg(err.message || 'Chyba při přihlášení přes Google.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setErrorMsg('Přihlášení přes Google se nezdařilo.');
    }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Vítejte zpět!');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při přihlášení.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Hesla se neshodují');
      return;
    }
    const strength = getPasswordStrength(formData.password);
    if (strength < 3) {
      setErrorMsg('Heslo nesplňuje bezpečnostní požadavky');
      return;
    }
    setIsLoading(true);
    try {
      await register(formData.firstName, formData.lastName, formData.email, formData.password);
      toast.success('Registrace úspěšná! Zkontrolujte e-mail pro ověřovací kód.');
      setMode('otp');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při registraci.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Kód musí mít 6 číslic.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await verify(formData.email, otpCode);
      toast.success('E-mail ověřen! Nyní se můžete přihlásit.');
      setMode('login');
      // Vyčistíme hesla a kód
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setOtpCode('');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při ověřování.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await resendOtp(formData.email);
      toast.success('Nový kód byl úspěšně odeslán.');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při odesílání nového kódu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrorMsg('Zadejte prosím e-mail.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await forgotPassword(formData.email);
      toast.success(res.message || 'Odkaz pro obnovu hesla odeslán.');
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při žádosti o obnovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode.length !== 6) {
      setErrorMsg('Kód musí mít 6 číslic.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Hesla se neshodují');
      return;
    }
    const strength = getPasswordStrength(formData.password);
    if (strength < 3) {
      setErrorMsg('Heslo nesplňuje bezpečnostní požadavky');
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPassword(formData.email, otpCode, formData.password);
      toast.success(res.message || 'Heslo bylo úspěšně změněno.');
      setMode('login');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setOtpCode('');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při změně hesla.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">
      
      {/* Subtle background glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute w-[800px] h-[800px] rounded-[100%] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Top Nav */}
        <div className="mb-6 flex justify-center w-full">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 font-semibold text-[13px] uppercase tracking-widest glass px-5 py-2.5 rounded-full cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Zpět domů</span>
          </button>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-6 sm:p-10 w-full max-w-md rounded-[2rem] relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-6">
            <img src={JourneoBlackLogo} alt="Journeo Logo" className="h-10 w-auto object-contain mx-auto mb-4 drop-shadow-md block dark:hidden" />
            <img src={JourneoWhiteLogo} alt="Journeo Logo" className="h-10 w-auto object-contain mx-auto mb-4 drop-shadow-md hidden dark:block" />
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {mode === 'login' ? 'Vítejte zpět' : 
               mode === 'forgot' ? 'Zapomenuté heslo' :
               mode === 'reset' ? 'Nové heslo' : 'Začněte psát'}
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
              {mode === 'login'
                ? 'Přihlaste se ke svému deníku.'
                : mode === 'forgot'
                ? 'Zadejte e-mail pro obnovu hesla.'
                : mode === 'reset'
                ? 'Zadejte kód z e-mailu a nastavte si nové heslo.'
                : 'Vytvořte si účet pro další cestu.'}
            </p>
          </div>

          {/* Pill Toggle */}
          <div className={`relative flex p-1 mb-6 bg-gray-100/80 dark:bg-white/5 rounded-full ${['otp', 'forgot', 'reset'].includes(mode) ? 'hidden' : ''}`}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 relative py-2.5 text-[13px] font-bold z-10 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed ${mode === 'login' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {mode === 'login' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Přihlásit</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 relative py-2.5 text-[13px] font-bold z-10 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed ${mode === 'register' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {mode === 'register' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Zaregistrovat</span>
            </button>
          </div>

          {/* Form Area */}
          <div className="relative overflow-visible min-h-[160px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {mode === 'otp' ? (
                  <div className="py-2">
                    <div className="text-center space-y-3 mb-6">
                      <div className="mx-auto w-14 h-14 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                        <Check size={28} className="text-blue-500" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zkontrolujte si e-mail</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Zadejte 6-místný kód, který jsme zaslali na <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>
                      </p>
                    </div>

                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                      >
                        {errorMsg}
                      </motion.div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                      <input
                        type="text"
                        name="otp"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpCode(val);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="123456"
                        className="w-full text-center tracking-[1em] text-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white placeholder-gray-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                      />

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6}
                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Ověřuji...' : 'Ověřit účet'}
                      </button>
                    </form>

                    <div className="mt-6 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Znovu odeslat kód
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); setOtpCode(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        Vrátit se na přihlášení
                      </button>
                    </div>
                  </div>
                ) : mode === 'forgot' ? (
                  <div className="py-2">
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Zadejte svůj e-mail"
                        autoComplete="email"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !formData.email}
                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Zpracovávám...' : 'Odeslat odkaz'}
                      </button>
                    </form>
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        Vrátit se na přihlášení
                      </button>
                    </div>
                  </div>
                ) : mode === 'reset' ? (
                  <div className="py-2">
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Kód z e-mailu</label>
                        <input
                          type="text"
                          name="otp"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setOtpCode(val);
                            if (errorMsg) setErrorMsg('');
                          }}
                          placeholder="123456"
                          className="w-full text-center tracking-[1em] text-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Nové heslo</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Zadejte nové heslo"
                            className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                          </button>
                        </div>
                        
                        {formData.password.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {/* Strength Meter */}
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map((segment) => {
                                const strength = getPasswordStrength(formData.password);
                                let bgClass = 'bg-black/10 dark:bg-white/10';
                                if (strength >= segment) {
                                  if (strength === 1) bgClass = 'bg-red-500';
                                  else if (strength === 2) bgClass = 'bg-yellow-500';
                                  else bgClass = 'bg-green-500';
                                }
                                return (
                                  <div 
                                    key={segment} 
                                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${bgClass}`} 
                                  />
                                );
                              })}
                            </div>
                            {/* Requirements List */}
                            <div className="space-y-1.5 px-1">
                              {[
                                { label: 'Alespoň 8 znaků', met: formData.password.length >= 8 },
                                { label: 'Obsahuje velké písmeno', met: /[A-Z]/.test(formData.password) },
                                { label: 'Obsahuje číslici', met: /[0-9]/.test(formData.password) },
                              ].map((req, i) => (
                                <div key={i} className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-300 ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  <div className={`p-0.5 rounded-full ${req.met ? 'bg-green-100 dark:bg-green-500/20' : 'bg-transparent'}`}>
                                    {req.met ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={3} className="opacity-50" />}
                                  </div>
                                  <span>{req.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Potvrďte nové heslo"
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6 || !formData.password}
                        className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Ukládám...' : 'Uložit nové heslo'}
                      </button>
                    </form>
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); setOtpCode(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        Vrátit se na přihlášení
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                  >
                    {errorMsg}
                  </motion.div>
                )}

                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
                  
                  {/* Registration Only Fields */}
                  {mode === 'register' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Jméno"
                        autoComplete="given-name"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Příjmení"
                        autoComplete="family-name"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                    </div>
                  )}

                  {/* Email */}
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-mail"
                    autoComplete="email"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  />

                  {/* Password */}
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Heslo"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                          className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          Zapomněli jste heslo?
                        </button>
                      </div>
                    )}

                    {/* Password Strength UI for Registration */}
                    {mode === 'register' && formData.password.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {/* Strength Meter */}
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map((segment) => {
                            const strength = getPasswordStrength(formData.password);
                            let bgClass = 'bg-black/10 dark:bg-white/10';
                            if (strength >= segment) {
                              if (strength === 1) bgClass = 'bg-red-500';
                              else if (strength === 2) bgClass = 'bg-yellow-500';
                              else bgClass = 'bg-green-500';
                            }
                            return (
                              <div 
                                key={segment} 
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${bgClass}`} 
                              />
                            );
                          })}
                        </div>
                        {/* Requirements List */}
                        <div className="space-y-1.5 px-1">
                          {[
                            { label: 'Alespoň 8 znaků', met: formData.password.length >= 8 },
                            { label: 'Obsahuje velké písmeno', met: /[A-Z]/.test(formData.password) },
                            { label: 'Obsahuje číslici', met: /[0-9]/.test(formData.password) },
                          ].map((req, i) => (
                            <div key={i} className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-300 ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              <div className={`p-0.5 rounded-full ${req.met ? 'bg-green-100 dark:bg-green-500/20' : 'bg-transparent'}`}>
                                {req.met ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={3} className="opacity-50" />}
                              </div>
                              <span>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  {mode === 'register' && (
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Potvrdit heslo"
                      autoComplete="new-password"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? 'Zpracovávám...'
                      : mode === 'login'
                        ? 'Přihlásit se'
                        : 'Vytvořit účet'}
                  </button>
                </form>

                {/* OAuth Section */}
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                  <span className="flex-shrink-0 mx-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Nebo</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={() => googleLoginFn()}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed glass"
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 dark:border-white/30 dark:border-t-white rounded-full animate-spin"></div>
                      <span className="opacity-70">Zpracovávám...</span>
                    </div>
                  ) : (
                    <>
                      <img src={GoogleIcon} alt="Google" className="w-[18px] h-[18px]" />
                      <span>Pokračovat přes Google</span>
                    </>
                  )}
                </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
