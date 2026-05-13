import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, ChevronLeft, ShieldCheck, Lock, Eye, EyeOff, User, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import StarBackground from './StarBackground';
import { useAuth } from '../../contexts/AuthContext';

const AuthFlow = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <StarBackground />

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-20 flex items-center gap-3 text-slate-400 hover:text-white transition-all group"
      >
        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-105 transition-all">
          <ChevronLeft size={22} />
        </div>
        <span className="text-sm font-bold tracking-wide hidden sm:block uppercase">Zpět na úvod</span>
      </motion.button>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {mode === 'login' ? 'Vítejte zpět' : 'Vytvořit účet'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {mode === 'login' ? 'Přihlaste se ke svému účtu Journeo.' : 'Začněte svou cestu s námi ještě dnes.'}
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1 bg-white/[0.05] rounded-2xl border border-white/5">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Přihlášení
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'register' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Registrace
                </button>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="E-mail"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Heslo"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {mode === 'register' && (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Potvrďte heslo"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  )}
                </div>

                <button
                  disabled={isLoading}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? "Zpracovávám..." : (mode === 'login' ? "Přihlásit se" : "Zaregistrovat se")}
                </button>
              </form>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 whitespace-nowrap">Nebo pokračovat přes</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-white text-sm font-medium transition-all">
                  <Layout size={18} className="text-blue-400" />
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-white text-sm font-medium transition-all">
                  <User size={18} />
                  GitHub
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center opacity-40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>Bezpečné šifrování dat Journeo</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthFlow;
