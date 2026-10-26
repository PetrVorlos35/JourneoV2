import { useTranslation } from 'react-i18next';
import { Check, X, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * First steps in a fresh trip. Each task is something the user does in the
 * real UI (not a tour), ticks itself off when it's done, and the whole card
 * turns into a short "you're set" note once everything is ticked.
 *
 * tasks: [{ id, label, done, onClick }]
 */
const WelcomeChecklist = ({ title, tasks, onDismiss }) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const doneCount = tasks.filter((task) => task.done).length;
  const allDone = doneCount === tasks.length;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: EASE }}
      aria-label={title}
      className="mb-4 sm:mb-5 lg:mr-[176px] rounded-[1.75rem] bg-page border border-gray-200/80 dark:border-white/10 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_32px_-16px_rgba(17,24,39,0.12)] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] sm:text-[18px] font-bold tracking-tight text-primary">
            {allDone ? t('onboarding.checklist.doneTitle') : title}
          </h2>
          <p className="text-[13px] font-medium text-muted mt-0.5">
            {allDone
              ? t('onboarding.checklist.doneSubtitle')
              : t('onboarding.checklist.progress', { done: doneCount, total: tasks.length })}
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label={t('common.close')}
          className="w-11 h-11 -mr-2 -mt-2 shrink-0 flex items-center justify-center rounded-2xl text-muted hover:text-primary hover:bg-field transition-colors cursor-pointer"
        >
          <X size={17} strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-subtle overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
          initial={false}
          animate={{ width: `${(doneCount / tasks.length) * 100}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
        />
      </div>

      <AnimatePresence initial={false}>
        {!allDone && (
          <motion.ul
            exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
            className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 overflow-hidden"
          >
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  onClick={task.onClick}
                  disabled={task.done || !task.onClick}
                  className={`group w-full min-h-[52px] flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 border transition-colors ${
                    task.done
                      ? 'border-transparent bg-field cursor-default'
                      : 'border-gray-200/80 dark:border-white/10 hover:bg-field cursor-pointer'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                    task.done ? 'bg-emerald-600 dark:bg-emerald-500 text-white' : 'border-2 border-check'
                  }`}>
                    {task.done && <Check size={13} strokeWidth={3.5} aria-hidden="true" />}
                  </span>
                  <span className={`flex-1 min-w-0 text-[14px] font-semibold ${task.done ? 'text-muted line-through decoration-1' : 'text-primary'}`}>
                    {task.label}
                    {task.done && <span className="sr-only"> · {t('onboarding.checklist.done')}</span>}
                  </span>
                  {!task.done && (
                    <ArrowRight size={15} strokeWidth={2.5} className="shrink-0 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default WelcomeChecklist;
