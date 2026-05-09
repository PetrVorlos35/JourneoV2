import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { MapPin, BarChart2, Calendar, Users } from 'lucide-react';
import JourneoLogo from '../assets/Journeo_whitelogo.png';

// ── Navbar ────────────────────────────────────────────────────────
const LandingNavbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-wide text-white">Journeo</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#about" className="hover:text-white transition-colors">O aplikaci</a>
          <a href="#features" className="hover:text-white transition-colors">Funkce</a>
          <a href="#cta" className="hover:text-white transition-colors">Komunita</a>
        </div>

        <div className="hidden md:block">
          <Link to="/dashboard" className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors inline-block">
            Do aplikace
          </Link>
        </div>

        {/* Hamburger */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-2 mx-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 text-sm font-medium text-gray-300">
          <a href="#about" className="block hover:text-white" onClick={() => setOpen(false)}>O aplikaci</a>
          <a href="#features" className="block hover:text-white" onClick={() => setOpen(false)}>Funkce</a>
          <a href="#cta" className="block hover:text-white" onClick={() => setOpen(false)}>Komunita</a>
          <Link to="/dashboard" className="block bg-white text-black px-4 py-2 rounded-xl font-semibold text-center" onClick={() => setOpen(false)}>
            Do aplikace
          </Link>
        </div>
      )}
    </motion.nav>
  );
};

// ── Hero ────────────────────────────────────────────────────────
const Hero = () => {
  const fireConfetti = () => {
    confetti({ particleCount: 200, spread: 360, origin: { y: 0.6 } });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-gray-300 mb-6">
            Vaše osobní kniha výletů
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8"
        >
          Zaznamenávejte svá{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            dobrodružství
          </span>{' '}s Journeo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Jednoduchá a elegantní aplikace pro plánování, sdílení a uchovávání vzpomínek na všechny vaše výlety a cesty.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform inline-block text-center">
            Začít objevovat
          </Link>
          <button
            onClick={fireConfetti}
            className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            🎉 Slavnostní konfety
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// ── About ────────────────────────────────────────────────────────
const About = () => (
  <section id="about" className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 dark:from-black dark:via-gray-950 dark:to-gray-900">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
      >
        Naplánujte své{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">dobrodružství</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto"
      >
        Journeo je vaším cestovním deníkem nové generace. Plánujte itineráře den po dni, sledujte výdaje, ukládejte lokace a sdílejte zážitky se svými blízkými — vše na jednom místě.
      </motion.p>
    </div>
  </section>
);

// ── Features ────────────────────────────────────────────────────────
const featuresList = [
  {
    icon: Calendar,
    title: 'Denní plánování',
    description: 'Sestavte si itinerář den po dni. Zadejte lokace, aktivity a poznámky ke každému dni výletu.',
    color: 'text-blue-400 bg-blue-500/15',
  },
  {
    icon: BarChart2,
    title: 'Statistiky cest',
    description: 'Přehled všech vašich cest – počet výletů, strávené dny na cestách a naplánované aktivity.',
    color: 'text-purple-400 bg-purple-500/15',
  },
  {
    icon: MapPin,
    title: 'Sledování lokací',
    description: 'Ke každému výletnímu dni přiřaďte město nebo konkrétní místo, které plánujete navštívit.',
    color: 'text-green-400 bg-green-500/15',
  },
  {
    icon: Users,
    title: 'Sdílení a komunita',
    description: 'Brzy přijdou funkce pro sdílení výletů s přáteli a plánování společných dobrodružství.',
    color: 'text-orange-400 bg-orange-500/15',
  },
];

const Features = () => (
  <section id="features" className="py-24 bg-gray-800 dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
        >
          Vše co potřebujete pro{' '}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            dokonalý přehled
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg"
        >
          Aplikace navržená s ohledem na jednoduchost a krásný design. Zaznamenat výlet nebylo nikdy jednodušší.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuresList.map((f, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl hover:bg-white/10 hover:scale-105 transition-all duration-300"
          >
            <div className={`inline-flex p-3 rounded-xl mb-5 ${f.color}`}>
              <f.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ── CTA ────────────────────────────────────────────────────────
const CTA = () => {
  const fireConfetti = () => {
    confetti({ particleCount: 200, spread: 360, origin: { y: 0.6 } });
  };

  return (
    <section id="cta" className="py-24 bg-gradient-to-b from-gray-800 to-gray-950 dark:from-gray-900 dark:to-black text-center">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
        >
          Začněte své{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            dobrodružství
          </span>{' '}dnes
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gray-400 text-base sm:text-lg mb-10"
        >
          Žádná registrace, žádná databáze. Otevřete aplikaci a začněte plánovat hned teď.
        </motion.p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/dashboard" className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform inline-block text-center">
            Přejít do aplikace
          </Link>
          <button
            onClick={fireConfetti}
            className="w-full sm:w-auto px-10 py-4 bg-pink-600/80 text-white border border-pink-500/40 rounded-xl font-bold text-lg hover:bg-pink-600 transition-colors"
          >
            🎉 Slavme to spolu!
          </button>
        </div>
      </div>
    </section>
  );
};

// ── Footer ────────────────────────────────────────────────────────
// Inline SVG social icons (lucide-react v3 dropped social icon support)
const SocialIcon = ({ href, label, hover, path }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={`text-gray-500 ${hover} transition-all duration-200 hover:scale-110`}
    title={label}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d={path} />
    </svg>
  </a>
);

const socialLinks = [
  { href: 'https://instagram.com/petr.vorel35', label: 'Instagram', hover: 'hover:text-pink-400', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { href: 'https://facebook.com/PetrVorlicek06', label: 'Facebook', hover: 'hover:text-blue-500', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { href: 'https://x.com/Vorel35', label: 'X / Twitter', hover: 'hover:text-sky-400', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { href: 'https://www.linkedin.com/in/petr-vorlicek/', label: 'LinkedIn', hover: 'hover:text-blue-400', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { href: 'https://github.com/PetrVorlos35/Journeo', label: 'GitHub', hover: 'hover:text-gray-300', path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
];

const Footer = () => (
  <footer className="bg-gray-950 dark:bg-gray-950 border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left mb-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
            <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
            <span className="text-white text-xl font-bold">Journeo</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Vaše osobní aplikace pro plánování a zaznamenávání výletů a cest. Navržena s láskou.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Rychlé odkazy</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/" className="hover:text-white transition-colors">Domů</a></li>
            <li><a href="#about" className="hover:text-white transition-colors">O aplikaci</a></li>
            <li><a href="#features" className="hover:text-white transition-colors">Funkce</a></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-white font-semibold mb-4">Sledujte nás</h3>
          <div className="flex items-center gap-4 justify-center md:justify-start flex-wrap">
            {socialLinks.map(s => <SocialIcon key={s.label} {...s} />)}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} Journeo — Petr Vorlíček. Všechna práva vyhrazena.
      </div>
    </div>
  </footer>
);

// ── LandingPage (assembles everything) ────────────────────────────
const LandingPage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
    className="min-h-screen bg-gray-950 dark:bg-black font-sans selection:bg-indigo-500/30"
  >
    <LandingNavbar />
    <Hero />
    <About />
    <Features />
    <CTA />
    <Footer />
  </motion.div>
);

export default LandingPage;
