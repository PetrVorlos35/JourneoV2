import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import GoogleIcon from '../../assets/google.png';

const AuthFlow = () => {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Vítejte zpět!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Chyba při přihlášení.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Hesla se neshodují');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků');
      return;
    }
    setIsLoading(true);
    try {
      await register(formData.email, formData.password);
      toast.success('Registrace úspěšná! Vítejte v Journeo.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Chyba při registraci.');
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

      <div className="w-full max-w-md relative z-10">
        {/* Top Nav */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 font-semibold text-[13px] uppercase tracking-widest glass px-5 py-2.5 rounded-full"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Zpět domů</span>
          </button>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-8 sm:p-12 w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-md">
              J
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {mode === 'login' ? 'Vítejte zpět' : 'Začněte psát'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {mode === 'login'
                ? 'Přihlaste se ke svému deníku.'
                : 'Vytvořte si účet pro další cestu.'}
            </p>
          </div>

          {/* Form */}
          <div className="min-h-[280px]">
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
              
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="auth-email" className="block text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold px-4">
                  E-mail
                </label>
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vas@email.cz"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-4">
                  <label htmlFor="auth-password" className="block text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                    Heslo
                  </label>
                  {mode === 'login' && (
                    <a href="#" className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Zapomenuté heslo?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-2xl px-5 py-3.5 pr-12 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {mode === 'register' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="auth-confirm" className="block text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold px-4">
                    Potvrdit heslo
                  </label>
                  <input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:scale-[1.02] transition-transform duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading
                  ? 'Zpracovávám...'
                  : mode === 'login'
                    ? 'Přihlásit se'
                    : 'Vytvořit účet'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {mode === 'login' ? 'Nemáte účet? ' : 'Máte již účet? '}
              <span className="text-black dark:text-white font-bold ml-1">
                {mode === 'login' ? 'Zaregistrujte se' : 'Přihlaste se'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
