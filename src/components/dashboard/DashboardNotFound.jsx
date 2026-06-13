import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DashboardNotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full min-h-[80vh] overflow-hidden text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span className="text-[25vw] md:text-[20vw] font-black tracking-tighter text-black/[0.03] dark:text-white/[0.03] leading-none">
          404
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-md gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-2 text-gray-800 dark:text-white shadow-inner">
          <Compass size={32} strokeWidth={2} />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-white">
          {t('notFound.title')}
        </h1>

        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed px-4">
          {t('notFound.description')}
        </p>
      </motion.div>

    </div>
  );
};

export default DashboardNotFound;
