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

  if (!isOpen) return null;

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            {/* Close btn */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl mb-4 ${
              config?.variant === 'danger'
                ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}>
              <AlertTriangle size={22} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {config?.title || 'Potvrdit akci'}
            </h2>

            {/* Message */}
            {config?.message && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                {config.message}
              </p>
            )}

            {/* Prompt input */}
            {config?.type === 'prompt' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {config.inputLabel || 'Zadejte text pro potvrzení'}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.placeholder || ''}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                {config.requiredPhrase && inputValue && inputValue !== config.requiredPhrase && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">
                    Napište přesně: <span className="font-mono font-bold">{config.requiredPhrase}</span>
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => onCancel(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm"
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
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  config?.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
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
