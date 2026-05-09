import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import JourneoLogo from '../assets/Journeo_whitelogo.png';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-wide text-white">Journeo</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#about" className="hover:text-white transition-colors">O aplikaci</a>
          <a href="#features" className="hover:text-white transition-colors">Funkce</a>
          <a href="#community" className="hover:text-white transition-colors">Komunita</a>
        </div>

        <div>
          <Link to="/dashboard" className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors inline-block">
            Do aplikace
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
