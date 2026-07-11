import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import useForceLightTheme from '../../hooks/useForceLightTheme';
import OtpInput from './OtpInput';
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
  useForceLightTheme();
  const location = useLocation();
  const { t } = useTranslation();
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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, verify, resendOtp, forgotPassword, resetPassword } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Odpočet cooldownu pro opětovné odeslání ověřovacího kódu.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const googleLoginFn = useGoogleLogin({
    // Empty prompt = let Google decide: if the user is signed into a single
    // (already-consented) account, sign in directly with no chooser; if there
    // are two or more accounts, the account picker is shown.
    prompt: '',
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setErrorMsg('');
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.success(mode === 'login' ? t('auth.toasts.loginSuccess') : t('auth.toasts.googleRegisterSuccess'));
        navigate(location.state?.from || '/dashboard');
      } catch (err) {
        setErrorMsg(err.message || t('auth.errors.googleError'));
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setErrorMsg(t('auth.errors.googleFailed'));
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
      toast.success(t('auth.toasts.loginSuccess'));
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      setErrorMsg(err.message || t('auth.errors.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t('auth.errors.mismatch'));
      return;
    }
    const strength = getPasswordStrength(formData.password);
    if (strength < 3) {
      setErrorMsg(t('auth.errors.weak'));
      return;
    }
    setIsLoading(true);
    try {
      await register(formData.firstName, formData.lastName, formData.email, formData.password);
      toast.success(t('auth.toasts.registerSuccess'));
      setMode('otp');
    } catch (err) {
      setErrorMsg(err.message || t('auth.errors.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg(t('auth.otp.codeMustBe6'));
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await verify(formData.email, otpCode);
      toast.success(t('auth.toasts.verifySuccess'));
      setMode('login');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setOtpCode('');
    } catch (err) {
      setErrorMsg(err.message || t('auth.errors.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await resendOtp(formData.email);
      toast.success(t('auth.toasts.resendSuccess'));
      setResendCooldown(30); // odeslat lze nejvýš jednou za 30 s
    } catch (err) {
      // 429 = příliš brzy; nastav odpočet podle serveru
      if (err.status === 429) {
        setResendCooldown(err.retryAfter || 30);
      }
      setErrorMsg(err.message || t('auth.errors.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrorMsg(t('auth.forgot.enterEmail'));
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await forgotPassword(formData.email);
      toast.success(res.message || t('auth.toasts.resetSuccess'));
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || t('auth.errors.forgotError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode.length !== 6) {
      setErrorMsg(t('auth.otp.codeMustBe6'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t('auth.errors.mismatch'));
      return;
    }
    const strength = getPasswordStrength(formData.password);
    if (strength < 3) {
      setErrorMsg(t('auth.errors.weak'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPassword(formData.email, otpCode, formData.password);
      toast.success(res.message || t('auth.toasts.resetSuccess'));
      setMode('login');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setOtpCode('');
    } catch (err) {
      setErrorMsg(err.message || t('auth.errors.resetError'));
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
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 font-semibold text-[13px] glass px-5 py-2.5 rounded-full cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>{t('auth.backHome')}</span>
          </button>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-6 sm:p-10 w-full max-w-md rounded-[2rem] relative overflow-hidden">

          {/* Header */}
          <div className="text-center mb-6">
            <img src={JourneoBlackLogo} alt="Journeo Logo" className="h-10 w-auto object-contain mx-auto mb-4 drop-shadow-md block dark:hidden" />
            <img src={JourneoWhiteLogo} alt="Journeo Logo" className="h-10 w-auto object-contain mx-auto mb-4 drop-shadow-md hidden dark:block" />
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {mode === 'login' ? t('auth.title.login') :
               mode === 'forgot' ? t('auth.title.forgot') :
               mode === 'reset' ? t('auth.title.reset') : t('auth.title.register')}
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
              {mode === 'login'
                ? t('auth.subtitle.login')
                : mode === 'forgot'
                ? t('auth.subtitle.forgot')
                : mode === 'reset'
                ? t('auth.subtitle.reset')
                : t('auth.subtitle.register')}
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
              <span className="relative z-10">{t('auth.tab.login')}</span>
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
              <span className="relative z-10">{t('auth.tab.register')}</span>
            </button>
          </div>

          {/* Form Area */}
          <div className="relative overflow-visible min-h-[160px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={shouldReduceMotion ? false : { opacity: 0, x: mode === 'login' ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: mode === 'login' ? 15 : -15 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
              >
                {mode === 'otp' ? (
                  <div className="py-2">
                    <div className="text-center space-y-3 mb-6">
                      <div className="mx-auto w-14 h-14 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                        <Check size={28} className="text-blue-500" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('auth.otp.checkEmail')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('auth.otp.description')} <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>
                      </p>
                    </div>

                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          role="alert"
                          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                        >
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleVerify} className="space-y-4">
                      <OtpInput
                        value={otpCode}
                        autoFocus
                        disabled={isLoading}
                        onChange={(val) => {
                          setOtpCode(val);
                          if (errorMsg) setErrorMsg('');
                        }}
                      />

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6}
                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? t('auth.otp.verifying') : t('auth.otp.verify')}
                      </button>
                    </form>

                    <div className="mt-6 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading || resendCooldown > 0}
                        className="text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0
                          ? t('auth.otp.resendWait', { seconds: resendCooldown })
                          : t('auth.otp.resend')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); setOtpCode(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {t('auth.otp.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : mode === 'forgot' ? (
                  <div className="py-2">
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          role="alert"
                          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                        >
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className="sr-only">{t('auth.forgot.emailPlaceholder')}</label>
                        <input
                          type="email"
                          id="forgot-email"
                          name="email"
                          required
                          autoFocus
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder={t('auth.forgot.emailPlaceholder')}
                          autoComplete="email"
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !formData.email}
                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
                      </button>
                    </form>
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {t('auth.forgot.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : mode === 'reset' ? (
                  <div className="py-2">
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          role="alert"
                          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                        >
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label htmlFor="reset-otp" className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 block text-center">{t('auth.reset.codeLabel')}</label>
                        <OtpInput
                          value={otpCode}
                          autoFocus
                          disabled={isLoading}
                          onChange={(val) => {
                            setOtpCode(val);
                            if (errorMsg) setErrorMsg('');
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor="reset-password" className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{t('auth.reset.newPasswordLabel')}</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="reset-password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={t('auth.reset.newPasswordPlaceholder')}
                            className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                          </button>
                        </div>

                        {formData.password.length > 0 && (
                          <div className="mt-2.5 space-y-2">
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
                            <div className="space-y-1.5 px-1">
                              {[
                                { label: t('auth.passwordReq.length'), met: formData.password.length >= 8 },
                                { label: t('auth.passwordReq.uppercase'), met: /[A-Z]/.test(formData.password) },
                                { label: t('auth.passwordReq.digit'), met: /[0-9]/.test(formData.password) },
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
                        <label htmlFor="reset-confirm" className="sr-only">{t('auth.reset.confirmPasswordPlaceholder')}</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="reset-confirm"
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder={t('auth.reset.confirmPasswordPlaceholder')}
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6 || !formData.password}
                        className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? t('auth.reset.submitting') : t('auth.reset.submit')}
                      </button>
                    </form>
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); setOtpCode(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {t('auth.reset.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          role="alert"
                          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                        >
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">

                  {mode === 'register' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="firstName" className="sr-only">{t('auth.fields.firstName')}</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder={t('auth.fields.firstName')}
                          autoComplete="given-name"
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="sr-only">{t('auth.fields.lastName')}</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder={t('auth.fields.lastName')}
                          autoComplete="family-name"
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="sr-only">{t('auth.fields.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t('auth.fields.email')}
                      autoComplete="email"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="sr-only">{t('auth.fields.password')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={t('auth.fields.password')}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
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
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                    )}

                    {mode === 'register' && formData.password.length > 0 && (
                      <div className="mt-2.5 space-y-2">
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
                        <div className="space-y-1.5 px-1">
                          {[
                            { label: t('auth.passwordReq.length'), met: formData.password.length >= 8 },
                            { label: t('auth.passwordReq.uppercase'), met: /[A-Z]/.test(formData.password) },
                            { label: t('auth.passwordReq.digit'), met: /[0-9]/.test(formData.password) },
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

                  {mode === 'register' && (
                    <div>
                      <label htmlFor="confirmPassword" className="sr-only">{t('auth.fields.confirmPassword')}</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder={t('auth.fields.confirmPassword')}
                        autoComplete="new-password"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? t('auth.submit.loading')
                      : mode === 'login'
                        ? t('auth.submit.login')
                        : t('auth.submit.register')}
                  </button>
                </form>

                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                  <span className="flex-shrink-0 mx-3 text-gray-400 text-[12px] font-medium">{t('auth.or')}</span>
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
                      <span className="opacity-70">{t('auth.googleLoading')}</span>
                    </div>
                  ) : (
                    <>
                      <img src={GoogleIcon} alt="Google" className="w-[18px] h-[18px]" />
                      <span>{t('auth.google')}</span>
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
