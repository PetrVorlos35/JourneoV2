import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import JourneoWhiteLogo from '../../assets/Journeo_whitelogo.png';
import JourneoBlackLogo from '../../assets/Journeo_blacklogo.png';
import GoogleIcon from '../../assets/google.png';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();

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
    if (formData.password.length < 6) {
      setErrorMsg('Heslo musí mít alespoň 6 znaků');
      return;
    }
    setIsLoading(true);
    try {
      await register(formData.firstName, formData.lastName, formData.email, formData.password);
      toast.success('Registrace úspěšná! Vítejte v Journeo.');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Chyba při registraci.');
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
              {mode === 'login' ? 'Vítejte zpět' : 'Začněte psát'}
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
              {mode === 'login'
                ? 'Přihlaste se ke svému deníku.'
                : 'Vytvořte si účet pro další cestu.'}
            </p>
          </div>

          {/* Pill Toggle */}
          <div className="relative flex p-1 mb-6 bg-gray-100/80 dark:bg-white/5 rounded-full">
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
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Jméno"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Příjmení"
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
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  />

                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Heslo"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                    </button>
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
                      className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed"
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
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed glass"
                >
                  {isGoogleLoading ? (
                    <span className="animate-pulse">Zpracovávám...</span>
                  ) : (
                    <>
                      <img src={GoogleIcon} alt="Google" className="w-[18px] h-[18px]" />
                      <span>Pokračovat přes Google</span>
                    </>
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
