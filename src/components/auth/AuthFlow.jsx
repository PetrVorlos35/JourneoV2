import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import useForceLightTheme from '../../hooks/useForceLightTheme';
import OtpInput from './OtpInput';
import HeroTravel from '../../assets/hero_travel.webp';
import JourneoWhiteLogo from '../../assets/Journeo_whitelogo.png';
import GoogleIcon from '../../assets/google.png';

const EASE = [0.16, 1, 0.3, 1];

const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  return strength;
};

// Shared field styling for the frosted panel
const inputClass =
  'w-full bg-black/[0.04] border border-black/[0.06] rounded-xl px-4 py-2.5 text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all font-medium';
const labelClass = 'block text-[13px] font-semibold text-gray-700 mb-1';
const primaryBtnClass =
  'w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-600/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

const ErrorBanner = ({ message, reduceMotion }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? {} : { opacity: 0, y: -8 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        role="alert"
        className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold text-center"
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const PasswordChecklist = ({ password, t }) => {
  const strength = getPasswordStrength(password);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((segment) => {
          let bgClass = 'bg-black/10';
          if (strength >= segment) {
            if (strength === 1) bgClass = 'bg-red-500';
            else if (strength === 2) bgClass = 'bg-yellow-500';
            else bgClass = 'bg-green-500';
          }
          return (
            <div key={segment} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${bgClass}`} />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-0.5">
        {[
          { label: t('auth.passwordReq.length'), met: password.length >= 8 },
          { label: t('auth.passwordReq.uppercase'), met: /[A-Z]/.test(password) },
          { label: t('auth.passwordReq.digit'), met: /[0-9]/.test(password) },
        ].map((req, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-300 ${req.met ? 'text-green-600' : 'text-gray-500'}`}
          >
            {req.met ? <Check size={11} strokeWidth={4} /> : <X size={11} strokeWidth={3} className="opacity-50" />}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
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

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMsg('');
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

  const passwordToggleBtn = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
    >
      {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
    </button>
  );

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#1c2a20] font-sans">

      {/* Full-bleed photo with a slow settle-in */}
      <motion.img
        src={HeroTravel}
        alt=""
        aria-hidden="true"
        initial={shouldReduceMotion ? false : { scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Legibility overlays: vignette toward the bottom + darker photo edge on desktop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/30" />
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/40 via-transparent to-black/10" />

      {/* Back home */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-8 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-full bg-black/25 backdrop-blur-md border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/90 hover:bg-black/40 hover:text-white transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          <span>{t('auth.backHome')}</span>
        </button>
      </div>

      {/* Brand mark, top-right — same logo + wordmark lockup as the navbar.
          A glass pill keeps it legible no matter what part of the photo —
          sky, fog, foliage — sits behind it. */}
      <Link
        to="/"
        className="absolute top-5 right-5 sm:top-6 sm:right-8 z-20 flex items-center gap-2 rounded-full bg-black/25 backdrop-blur-md border border-white/20 pl-3 pr-4 py-2 hover:bg-black/40 transition-colors duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <img
          src={JourneoWhiteLogo}
          alt=""
          className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <span className="font-semibold text-[15px] tracking-tight text-white">Journeo</span>
      </Link>

      {/* Brand moment over the photo (desktop only) */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        className="absolute bottom-10 left-10 xl:bottom-14 xl:left-14 z-10 hidden lg:block max-w-md pointer-events-none select-none"
      >
        <p
          className="text-white text-3xl xl:text-4xl leading-snug rotate-[-1.5deg] drop-shadow-md"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          “{t('auth.scene.quote')}”
        </p>
        <p className="mt-4 text-sm text-white/80 font-medium max-w-xs">{t('auth.scene.tagline')}</p>
      </motion.div>

      {/* Form panel */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pt-20 pb-6 sm:px-6 lg:py-8 lg:justify-end lg:pr-[7vw]">
        <div className="w-full max-w-[430px]">

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[1.75rem] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.45)] p-5 sm:p-7"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
              >
                {mode === 'otp' ? (
                  <div>
                    <div className="text-center space-y-2.5 mb-6">
                      <div className="mx-auto w-14 h-14 bg-blue-600/10 rounded-full flex items-center justify-center mb-3">
                        <Check size={26} className="text-blue-600" strokeWidth={2.5} />
                      </div>
                      <h1 className="text-[22px] font-bold tracking-tight text-gray-900">{t('auth.otp.checkEmail')}</h1>
                      <p className="text-sm text-gray-600">
                        {t('auth.otp.description')}{' '}
                        <span className="font-semibold text-gray-900 break-all">{formData.email}</span>
                      </p>
                    </div>

                    <ErrorBanner message={errorMsg} reduceMotion={shouldReduceMotion} />

                    <form onSubmit={handleVerify} className="space-y-5">
                      <OtpInput
                        value={otpCode}
                        autoFocus
                        disabled={isLoading}
                        onChange={(val) => {
                          setOtpCode(val);
                          if (errorMsg) setErrorMsg('');
                        }}
                      />
                      <button type="submit" disabled={isLoading || otpCode.length !== 6} className={primaryBtnClass}>
                        {isLoading ? t('auth.otp.verifying') : t('auth.otp.verify')}
                      </button>
                    </form>

                    <div className="mt-6 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading || resendCooldown > 0}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0
                          ? t('auth.otp.resendWait', { seconds: resendCooldown })
                          : t('auth.otp.resend')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { switchMode('login'); setOtpCode(''); }}
                        className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {t('auth.otp.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : mode === 'forgot' ? (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1">{t('auth.title.forgot')}</h1>
                      <p className="text-sm text-gray-600">{t('auth.subtitle.forgot')}</p>
                    </div>

                    <ErrorBanner message={errorMsg} reduceMotion={shouldReduceMotion} />

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className={labelClass}>{t('auth.fields.email')}</label>
                        <input
                          type="email"
                          id="forgot-email"
                          name="email"
                          required
                          autoFocus
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="name@email.com"
                          autoComplete="email"
                          className={inputClass}
                        />
                      </div>
                      <button type="submit" disabled={isLoading || !formData.email} className={primaryBtnClass}>
                        {isLoading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
                      </button>
                    </form>

                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {t('auth.forgot.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : mode === 'reset' ? (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1">{t('auth.title.reset')}</h1>
                      <p className="text-sm text-gray-600">{t('auth.subtitle.reset')}</p>
                    </div>

                    <ErrorBanner message={errorMsg} reduceMotion={shouldReduceMotion} />

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label htmlFor="reset-otp" className={`${labelClass} text-center`}>{t('auth.reset.codeLabel')}</label>
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
                        <label htmlFor="reset-password" className={labelClass}>{t('auth.reset.newPasswordLabel')}</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="reset-password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                          />
                          {passwordToggleBtn}
                        </div>
                        {formData.password.length > 0 && <PasswordChecklist password={formData.password} t={t} />}
                      </div>

                      <div>
                        <label htmlFor="reset-confirm" className={labelClass}>{t('auth.fields.confirmPassword')}</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="reset-confirm"
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6 || !formData.password}
                        className={`${primaryBtnClass} mt-1`}
                      >
                        {isLoading ? t('auth.reset.submitting') : t('auth.reset.submit')}
                      </button>
                    </form>

                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { switchMode('login'); setOtpCode(''); }}
                        className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {t('auth.reset.backToLogin')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5">
                      <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1">
                        {mode === 'login' ? t('auth.title.login') : t('auth.title.register')}
                      </h1>
                      <p className="text-sm text-gray-600">
                        {mode === 'login' ? t('auth.subtitle.login') : t('auth.subtitle.register')}
                      </p>
                    </div>

                    <ErrorBanner message={errorMsg} reduceMotion={shouldReduceMotion} />

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
                      {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="firstName" className={labelClass}>{t('auth.fields.firstName')}</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              autoComplete="given-name"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className={labelClass}>{t('auth.fields.lastName')}</label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              autoComplete="family-name"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className={labelClass}>{t('auth.fields.email')}</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="name@email.com"
                          autoComplete="email"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <label htmlFor="password" className="text-[13px] font-semibold text-gray-700">
                            {t('auth.fields.password')}
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => switchMode('forgot')}
                              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              {t('auth.forgotPassword')}
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            className={`${inputClass} pr-12`}
                          />
                          {passwordToggleBtn}
                        </div>
                        {mode === 'register' && formData.password.length > 0 && (
                          <PasswordChecklist password={formData.password} t={t} />
                        )}
                      </div>

                      {mode === 'register' && (
                        <div>
                          <label htmlFor="confirmPassword" className={labelClass}>{t('auth.fields.confirmPassword')}</label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={inputClass}
                          />
                        </div>
                      )}

                      <button type="submit" disabled={isLoading || isGoogleLoading} className={`${primaryBtnClass} mt-2`}>
                        {isLoading ? (
                          t('auth.submit.loading')
                        ) : (
                          <>
                            <span>{mode === 'login' ? t('auth.submit.login') : t('auth.submit.register')}</span>
                            <ArrowRight size={16} strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="relative flex items-center my-3.5">
                      <div className="flex-grow border-t border-gray-900/10"></div>
                      <span className="flex-shrink-0 mx-3 text-gray-500 text-[12px] font-medium">{t('auth.or')}</span>
                      <div className="flex-grow border-t border-gray-900/10"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => googleLoginFn()}
                      disabled={isLoading || isGoogleLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-gray-900/10 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                          <span className="opacity-70">{t('auth.googleLoading')}</span>
                        </>
                      ) : (
                        <>
                          <img src={GoogleIcon} alt="" className="w-[18px] h-[18px]" />
                          <span>{t('auth.google')}</span>
                        </>
                      )}
                    </button>

                    <p className="mt-4 text-center text-sm text-gray-600">
                      {mode === 'login' ? t('auth.switch.noAccount') : t('auth.switch.haveAccount')}{' '}
                      <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {mode === 'login' ? t('auth.switch.createOne') : t('auth.switch.logIn')}
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
