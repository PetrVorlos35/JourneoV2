// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const UNDO_MS = 5000;

/**
 * Toast „Smazáno · Vrátit zpět“ s odpočtem. Sdílí ho mazání výletů
 * i výdajů; vrací id toastu, ať ho akce zpět může zavřít.
 */
export const showUndoToast = ({ title, message, undoLabel, onUndo }) => toast.custom(
  (ts) => (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: ts.visible ? 1 : 0, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-page border border-black/5 dark:border-white/10 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center gap-3 pl-4 pr-3 py-3.5">
        <div className="w-9 h-9 shrink-0 rounded-full bg-danger-wash text-red-500 flex items-center justify-center">
          <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-primary truncate">{title}</p>
          <p className="text-[12px] font-medium text-muted">{message}</p>
        </div>
        <button
          onClick={onUndo}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {undoLabel}
        </button>
      </div>
      <motion.div
        className="h-[3px] bg-blue-500/70 dark:bg-blue-400/70 origin-left"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: UNDO_MS / 1000, ease: 'linear' }}
      />
    </motion.div>
  ),
  { duration: UNDO_MS }
);
