import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Clock, MapPin, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImage from '../../assets/hero_travel.png';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';

export const HorizontalScrollCarousel = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });
  const { t } = useTranslation();

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  const cards = [
    {
      id: 1,
      title: t('carousel.card1.title'),
      subtitle: t('carousel.card1.subtitle'),
      content: (
        <div className="glass-card bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full max-w-sm flex flex-col items-center text-center group">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6 bg-blue-500/20 px-4 py-2 rounded-full">
            <Clock size={16} strokeWidth={2.5} /> {t('carousel.card1.countdownLabel')}
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-7xl font-bold tracking-tighter text-white leading-none">14</span>
            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">{t('carousel.card1.days')}</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">{t('carousel.card1.destination')}</h3>
          <p className="text-gray-400 font-medium mt-2">{t('carousel.card1.departure')}</p>
        </div>
      ),
      bg: "bg-gradient-to-br from-gray-900 to-black"
    },
    {
      id: 2,
      title: t('carousel.card2.title'),
      subtitle: t('carousel.card2.subtitle'),
      content: (
        <div className="glass-card bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full max-w-sm group">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
            <MapPin size={32} strokeWidth={2} />
          </div>
          <h3 className="text-3xl font-bold mb-3 text-white tracking-tight">{t('carousel.card2.destination')}</h3>
          <div className="flex items-center text-sm font-bold text-gray-300 gap-2 mb-6">
            <Calendar size={16} strokeWidth={2} />
            <span>{t('carousel.card2.place')}</span>
          </div>
          <div className="pt-6 border-t border-white/20 flex justify-between items-center">
            <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">{t('carousel.card2.activities')}</span>
            <span className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">{t('carousel.card2.open')} <ArrowRight size={14}/></span>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-br from-black to-slate-900"
    },
    {
      id: 3,
      title: t('carousel.card3.title'),
      subtitle: t('carousel.card3.subtitle'),
      content: (
        <div className="glass-card bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full max-w-sm group">
          <h3 className="text-emerald-300 text-xs flex items-center gap-2 mb-8 uppercase tracking-widest font-bold bg-emerald-500/20 px-4 py-2 rounded-full w-fit">
            <TrendingUp size={16} strokeWidth={2.5} /> {t('carousel.card3.statsLabel')}
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <span className="text-6xl font-bold text-white leading-none tracking-tighter">12</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">{t('carousel.card3.countries')}</p>
            </div>
            <div>
              <span className="text-6xl font-bold text-white leading-none tracking-tighter">45</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">{t('carousel.card3.daysLabel')}</p>
            </div>
          </div>
        </div>
      ),
      bg: "bg-gradient-to-tr from-gray-900 to-black"
    },
    {
      id: 4,
      title: t('carousel.card4.title'),
      subtitle: t('carousel.card4.subtitle'),
      content: (
        <div className="w-full max-w-md text-center">
          <img src={JourneoLogo} alt="Journeo Logo" className="h-32 w-auto object-contain mx-auto mb-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
        </div>
      ),
      bg: "bg-black"
    }
  ];

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-black hidden md:block">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src={heroImage} className="w-full h-full object-cover grayscale blur-sm" alt="Background" />
        </div>

        <motion.div style={{ x }} className="relative z-10 flex w-[400vw]">
          {cards.map((card) => {
            return (
              <div key={card.id} className="w-[100vw] h-screen flex flex-col lg:flex-row items-center justify-center p-12 lg:p-32 gap-12 lg:gap-24">

                <div className="flex-1 w-full max-w-2xl text-left">
                  <h2 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
                    {card.title}.
                  </h2>
                  <p className="text-xl lg:text-2xl text-gray-400 font-medium">
                    {card.subtitle}
                  </p>
                </div>

                <div className="flex-1 w-full flex justify-center lg:justify-end items-center">
                  {card.content}
                </div>

              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HorizontalScrollCarousel;
