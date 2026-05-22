import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, BookOpen, Compass } from 'lucide-react';
import JourneoLogo from '../assets/Journeo_whitelogo.png';
import heroImage from '../assets/hero_travel.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen selection:bg-journeo-accent/30 overflow-x-hidden">

      {/* ===== Navbar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-journeo-dark/90 backdrop-blur-md border-b border-journeo-border">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 md:px-16 h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="font-serif text-2xl tracking-tight mt-1">Journeo</span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex items-center gap-8 text-[14px] text-journeo-text-muted">
              <a href="#features" className="hover:text-journeo-text transition-colors duration-300">Funkce</a>
              <a href="#about" className="hover:text-journeo-text transition-colors duration-300">Příběh</a>
            </div>
            <Link
              to="/auth"
              className="text-[14px] font-medium text-journeo-accent hover:text-journeo-accent-hover transition-colors duration-300"
            >
              Přihlásit se
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative pt-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 items-center min-h-[calc(100vh-80px)] py-10 lg:py-0">

            {/* Left — text (7 cols) */}
            <div className="lg:col-span-7 space-y-8 lg:space-y-10 lg:pr-8">
              <div className="space-y-6 lg:space-y-8">
                <p className="text-[11px] sm:text-[13px] text-journeo-text-subtle tracking-[0.2em] uppercase font-medium">
                  Cestovatelský deník
                </p>

                <h1 className="font-serif text-[2.75rem] sm:text-[4rem] lg:text-[6.5rem] leading-[1.05] tracking-tight">
                  Zaznamenávejte<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>svá <em className="text-journeo-accent not-italic">dobrodružství</em>
                </h1>

                <p className="text-base sm:text-xl text-journeo-text-muted leading-relaxed max-w-xl font-light">
                  Každý krok, každý objev, každá vzpomínka. Váš osobní cestovatelský deník, který má duši. Navrženo pro ty, kteří cestují s účelem.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6 pt-2 sm:pt-4">
                <Link
                  to="/auth"
                  className="group inline-flex justify-center items-center gap-3 px-8 py-4 bg-journeo-accent text-journeo-dark text-[15px] font-medium rounded-sm hover:bg-journeo-accent-hover transition-colors duration-300"
                >
                  Začít psát
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 text-[15px] font-medium text-journeo-text-muted hover:text-journeo-text bg-journeo-surface sm:bg-transparent rounded-sm transition-colors duration-300"
                >
                  Zjistit více
                </a>
              </div>

              {/* Minimal stats */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-12 pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-journeo-border">
                <div className="space-y-1">
                  <span className="font-serif text-2xl sm:text-3xl text-journeo-text">200+</span>
                  <p className="text-[10px] sm:text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">cestovatelů</p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-journeo-border" />
                <div className="space-y-1">
                  <span className="font-serif text-2xl sm:text-3xl text-journeo-text">1.2k</span>
                  <p className="text-[10px] sm:text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">výletů</p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-journeo-border" />
                <div className="space-y-1">
                  <span className="font-serif text-2xl sm:text-3xl text-journeo-text">48</span>
                  <p className="text-[10px] sm:text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">zemí</p>
                </div>
              </div>
            </div>

            {/* Right — image (5 cols) */}
            <div className="lg:col-span-5 relative w-full h-[350px] sm:h-[500px] lg:h-[750px] mt-8 lg:mt-0">
              <div className="absolute inset-0 overflow-hidden rounded-sm bg-journeo-surface">
                <img
                  src={heroImage}
                  alt="Horská silnice při západu slunce"
                  className="w-full h-full object-cover opacity-90 mix-blend-lighten"
                />
              </div>
              {/* Overlay minimal card */}
              <div className="absolute -bottom-8 -left-8 bg-journeo-surface border border-journeo-border-strong p-8 rounded-sm shadow-2xl z-10 w-72 hidden md:block">
                <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium mb-3">Poslední výlet</p>
                <p className="font-serif text-2xl text-journeo-text">Transfăgărășan</p>
                <p className="text-[14px] text-journeo-text-muted mt-2">Rumunsko, 4 dny</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-20 md:py-32 bg-journeo-surface border-y border-journeo-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          {/* Section header */}
          <div className="max-w-2xl mb-16 md:mb-24 space-y-4 md:space-y-6">
            <p className="text-[11px] sm:text-[13px] text-journeo-text-subtle tracking-[0.2em] uppercase font-medium">Více než jen deník</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl text-journeo-text tracking-tight leading-[1.1]">
              Vše pro vaše cesty,<br className="hidden sm:block" />na jednom místě.
            </h2>
          </div>

          {/* Asymmetric feature grid using modern CSS grid */}
          <div className="grid md:grid-cols-12 gap-px bg-journeo-border rounded-sm overflow-hidden border border-journeo-border">
            
            <div className="md:col-span-8 bg-journeo-surface p-8 sm:p-12 md:p-16 hover:bg-journeo-surface-hover transition-colors duration-500 flex flex-col justify-end min-h-[300px] md:min-h-[360px]">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-journeo-accent">
                <BookOpen size={28} strokeWidth={1.2} className="md:w-8 md:h-8" />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl mb-3 md:mb-4 text-journeo-text">Denní itinerář</h3>
              <p className="text-journeo-text-muted text-base md:text-lg leading-relaxed max-w-xl font-light">
                Sestavte si plán den po dni. Lokace, aktivity, poznámky — vše přehledně na jednom místě.
                Žádné zbytečné komplikace, jen čisté plánování a radost z cesty.
              </p>
            </div>

            <div className="md:col-span-4 bg-journeo-surface p-8 sm:p-12 md:p-16 hover:bg-journeo-surface-hover transition-colors duration-500 flex flex-col justify-end min-h-[300px] md:min-h-[360px]">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-journeo-accent">
                <MapPin size={28} strokeWidth={1.2} className="md:w-8 md:h-8" />
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-journeo-text">Mapa vzpomínek</h3>
              <p className="text-journeo-text-muted text-[15px] md:text-[16px] leading-relaxed font-light">
                Sledujte, kde všude jste byli. Vaše osobní mapa se plní s každým výletem.
              </p>
            </div>

            <div className="md:col-span-4 bg-journeo-surface p-8 sm:p-12 md:p-16 hover:bg-journeo-surface-hover transition-colors duration-500 flex flex-col justify-end min-h-[300px] md:min-h-[360px]">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-journeo-accent">
                <Compass size={28} strokeWidth={1.2} className="md:w-8 md:h-8" />
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-journeo-text">Statistiky</h3>
              <p className="text-journeo-text-muted text-[15px] md:text-[16px] leading-relaxed font-light">
                Počet zemí, strávené dny, ujeté kilometry. Čísla, která vypráví váš příběh.
              </p>
            </div>

            <div className="md:col-span-8 bg-journeo-surface p-8 sm:p-12 md:p-16 hover:bg-journeo-surface-hover transition-colors duration-500 flex flex-col justify-end min-h-[300px] md:min-h-[360px] relative overflow-hidden">
              <div className="absolute top-8 right-8 md:top-12 md:right-12 px-3 py-1 md:px-4 md:py-1.5 border border-journeo-accent/30 text-journeo-accent text-[10px] md:text-[11px] tracking-widest uppercase font-medium rounded-sm">
                Již brzy
              </div>
              <h3 className="font-serif text-2xl md:text-3xl mb-3 md:mb-4 text-journeo-text">Sdílení s přáteli</h3>
              <p className="text-journeo-text-muted text-base md:text-lg leading-relaxed max-w-xl font-light">
                Sdílejte výlety, plánujte společně, inspirujte se navzájem.
                Komunita cestovatelů, kteří to myslí vážně.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Pullquote / Editorial break ===== */}
      <section id="about" className="py-24 md:py-40">
        <div className="max-w-[1000px] mx-auto px-6 text-center space-y-10 md:space-y-12">
          <p className="font-serif text-[2rem] md:text-[3.5rem] text-journeo-text leading-[1.3] md:leading-[1.2] italic text-balance">
            „Cestování je jediná věc, za kterou zaplatíte a&nbsp;přitom vás udělá bohatšími."
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="w-12 sm:w-16 h-px bg-journeo-border-strong" />
            <p className="text-[11px] sm:text-[13px] text-journeo-text-subtle uppercase tracking-[0.15em] font-medium">Journeo — pro ty, kteří cestují s příběhem</p>
            <div className="w-12 sm:w-16 h-px bg-journeo-border-strong" />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 md:py-40 bg-journeo-surface border-t border-journeo-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:gap-24">
            <div className="space-y-4 md:space-y-6 max-w-2xl flex-1">
              <h2 className="font-serif text-4xl md:text-6xl text-journeo-text tracking-tight leading-tight">
                Začněte svůj<br />příběh dnes.
              </h2>
              <p className="text-journeo-text-muted text-base md:text-lg leading-relaxed font-light">
                Vytvořte si účet zdarma a zaznamenejte svůj další výlet. Žádné závazky, žádné zbytečnosti. Prostor jen pro vaše vzpomínky.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to="/auth"
                className="group flex items-center justify-center gap-4 px-10 py-5 bg-journeo-accent text-journeo-dark text-lg font-medium rounded-sm hover:bg-journeo-accent-hover transition-colors duration-300 w-full sm:w-auto"
              >
                Vstoupit do Journeo
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-12 border-t border-journeo-border bg-journeo-dark">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src={JourneoLogo} alt="Journeo" className="w-5 h-5 object-contain opacity-50" />
            <span className="font-serif text-xl text-journeo-text-subtle mt-0.5">Journeo</span>
          </div>
          <p className="text-journeo-text-subtle text-[13px] font-medium tracking-wide">
            &copy; {new Date().getFullYear()} Petr Vorlíček. Všechna práva vyhrazena.
          </p>
          <div className="flex gap-8 text-journeo-text-subtle text-[13px] font-medium tracking-wide">
            <a href="#" className="hover:text-journeo-text transition-colors duration-300">Instagram</a>
            <a href="#" className="hover:text-journeo-text transition-colors duration-300">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
