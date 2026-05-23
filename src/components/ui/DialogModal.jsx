import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable confirm/prompt dialog that replaces browser alerts.
 */

// ── Internal modal UI ──────────────────────────────────────────────
const DialogModal = ({ isOpen, config, onConfirm, onCancel, onClose }) => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // focus input on next tick if prompt mode
      if (config?.type === 'prompt') {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
  }, [isOpen, config]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (config?.type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm(true);
    }
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-[2rem] w-full max-w-md p-8 shadow-2xl"
          >
            {/* Close btn */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Icon */}
            <div className={`inline-flex p-4 rounded-2xl mb-6 ${
              config?.variant === 'danger'
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white mb-4">
              {config?.title || 'Potvrdit akci'}
            </h2>

            {/* Message */}
            {config?.message && (
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                {config.message}
              </p>
            )}

            {/* Prompt input */}
            {config?.type === 'prompt' && (
              <div className="mb-8">
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                  {config.inputLabel || 'Zadejte text pro potvrzení'}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.placeholder || ''}
                  className="glass-input"
                />
                {config.requiredPhrase && inputValue && inputValue !== config.requiredPhrase && (
                  <p className="text-[11px] font-bold text-red-500 mt-3 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle size={12} strokeWidth={3} />
                    Napište přesně: <span className="italic">{config.requiredPhrase}</span>
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
              <button
                onClick={() => onCancel(false)}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl text-[13px] uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {config?.cancelLabel || 'Zrušit'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  config?.type === 'prompt' &&
                  config?.requiredPhrase &&
                  inputValue !== config.requiredPhrase
                }
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 ${
                  config?.variant === 'danger'
                    ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                    : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-500'
                }`}
              >
                {config?.confirmLabel || 'Potvrdit'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── Hook ───────────────────────────────────────────────────────────
export const useDialog = () => {
  const [state, setState] = useState({ isOpen: false, config: null });
  const resolverRef = useRef(null);

  const open = (config) =>
    new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ isOpen: true, config });
    });

  const handleConfirm = (value) => {
    setState({ isOpen: false, config: null });
    resolverRef.current?.(value);
  };

  const handleCancel = (value = false) => {
    setState({ isOpen: false, config: null });
    resolverRef.current?.(value);
  };

  const handleClose = () => {
    setState({ isOpen: false, config: null });
    resolverRef.current?.(null);
  };

  const confirmDialog = (config) => open({ type: 'confirm', ...config });
  const promptDialog = (config) => open({ type: 'prompt', ...config });

  const ModalPortal = (
    <DialogModal
      isOpen={state.isOpen}
      config={state.config}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );

  return { confirmDialog, promptDialog, ModalPortal };
};

export default DialogModal;
