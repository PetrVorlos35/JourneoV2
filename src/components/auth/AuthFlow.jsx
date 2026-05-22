import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import authBg from '../../assets/auth_bg.png';
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
    <div className="h-[100dvh] bg-journeo-dark flex overflow-hidden">
      {/* Left — photo */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[50%] relative overflow-hidden h-full">
        <img
          src={authBg}
          alt="Horský výhled při východu slunce"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-journeo-dark/80 via-transparent to-journeo-dark/30" />

        {/* Branding overlay */}
        <div className="absolute top-12 left-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-journeo-text-muted hover:text-journeo-text transition-colors duration-300 group"
          >
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="font-serif text-2xl tracking-tight mt-1">Journeo</span>
          </button>
        </div>

        <div className="absolute bottom-16 left-12 right-12 max-w-lg">
          <p className="font-serif text-[clamp(2rem,3vw,2.5rem)] text-journeo-text leading-[1.2] italic">
            „Cestování je jediná věc,<br />
            za kterou zaplatíte a&nbsp;přitom<br />
            vás udělá bohatšími."
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col justify-center px-6 sm:px-16 lg:px-20 xl:px-28 py-6 sm:py-8 lg:py-12 h-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-[420px] mx-auto lg:mx-0">

          {/* Mobile back + logo */}
          <div className="mb-6 sm:mb-12 lg:mb-10 space-y-4 sm:space-y-6 lg:space-y-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-journeo-text-subtle hover:text-journeo-text text-[13px] uppercase tracking-widest font-medium transition-colors duration-300"
            >
              <ArrowLeft size={16} />
              <span>Zpět na hlavní stranu</span>
            </button>

            <div className="flex items-center gap-3 lg:hidden">
              <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain" />
              <span className="font-serif text-2xl text-journeo-text tracking-tight mt-1">Journeo</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 sm:mb-10 lg:mb-8 space-y-2 sm:space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl text-journeo-text">
              {mode === 'login' ? 'Vítejte zpět' : 'Začněte psát'}
            </h1>
            <p className="text-sm sm:text-base text-journeo-text-muted font-light">
              {mode === 'login'
                ? 'Přihlaste se ke svému cestovatelskému deníku.'
                : 'Vytvořte si účet a zaznamenejte svá dobrodružství.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 sm:mb-8 border-b border-journeo-border">
            <button
              onClick={() => setMode('login')}
              className={`pb-3 sm:pb-4 px-2 mr-8 text-[13px] sm:text-[14px] font-medium transition-colors duration-300 border-b-2 relative top-[1px] ${
                mode === 'login'
                  ? 'text-journeo-text border-journeo-accent'
                  : 'text-journeo-text-subtle border-transparent hover:text-journeo-text-muted'
              }`}
            >
              Přihlášení
            </button>
            <button
              onClick={() => setMode('register')}
              className={`pb-3 sm:pb-4 px-2 text-[13px] sm:text-[14px] font-medium transition-colors duration-300 border-b-2 relative top-[1px] ${
                mode === 'register'
                  ? 'text-journeo-text border-journeo-accent'
                  : 'text-journeo-text-subtle border-transparent hover:text-journeo-text-muted'
              }`}
            >
              Nová registrace
            </button>
          </div>

          {/* Form Wrapper to prevent layout jumping */}
          <div className="min-h-[280px] sm:min-h-[310px]">
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div className="space-y-1 sm:space-y-2 group">
                <label htmlFor="auth-email" className="block text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium transition-colors duration-300 group-focus-within:text-journeo-accent">
                  E-mailová adresa
                </label>
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vas@email.cz"
                  className="w-full bg-transparent border-b border-journeo-border-strong py-2 sm:py-3 text-base sm:text-lg text-journeo-text placeholder-journeo-text-subtle/50 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-light"
                />
              </div>

              {/* Password */}
              <div className="space-y-1 sm:space-y-2 group">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className="block text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium transition-colors duration-300 group-focus-within:text-journeo-accent">
                    Heslo
                  </label>
                  {mode === 'login' && (
                    <a href="#" className="text-[11px] sm:text-[12px] text-journeo-text-subtle hover:text-journeo-text transition-colors duration-300">
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
                    className="w-full bg-transparent border-b border-journeo-border-strong py-2 sm:py-3 pr-12 text-base sm:text-lg text-journeo-text placeholder-journeo-text-subtle/50 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-light"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-journeo-text-subtle hover:text-journeo-text transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {mode === 'register' && (
                <div className="space-y-1 sm:space-y-2 group">
                  <label htmlFor="auth-confirm" className="block text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium transition-colors duration-300 group-focus-within:text-journeo-accent">
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
                    className="w-full bg-transparent border-b border-journeo-border-strong py-2 sm:py-3 text-base sm:text-lg text-journeo-text placeholder-journeo-text-subtle/50 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-light"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 sm:py-4 mt-2 sm:mt-4 bg-journeo-accent text-journeo-dark text-[15px] sm:text-base font-medium rounded-sm hover:bg-journeo-accent-hover transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isLoading
                  ? 'Zpracovávám...'
                  : mode === 'login'
                    ? 'Přihlásit se'
                    : 'Vytvořit účet'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 sm:gap-6 my-6 sm:my-8 lg:my-6">
            <div className="flex-1 h-px bg-journeo-border" />
            <span className="text-[10px] sm:text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">nebo</span>
            <div className="flex-1 h-px bg-journeo-border" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 border border-journeo-border-strong rounded-sm text-[13px] sm:text-[14px] font-medium text-journeo-text-muted hover:border-journeo-accent hover:text-journeo-text transition-all duration-300">
              <img src={GoogleIcon} alt="Google" className="w-4 h-4 object-contain" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 border border-journeo-border-strong rounded-sm text-[13px] sm:text-[14px] font-medium text-journeo-text-muted hover:border-journeo-accent hover:text-journeo-text transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] sm:text-[12px] text-journeo-text-subtle mt-6 sm:mt-10 lg:mt-8 font-medium tracking-wide">
            Šifrováno a chráněno · Journeo {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
