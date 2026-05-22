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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 bg-journeo-surface border border-journeo-border-strong rounded-sm shadow-2xl w-full max-w-md p-8"
          >
            {/* Close btn */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-journeo-text-subtle hover:text-journeo-text transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-full mb-6 border ${
              config?.variant === 'danger'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-journeo-accent/10 text-journeo-accent border-journeo-accent/20'
            }`}>
              <AlertTriangle size={22} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl text-journeo-text mb-3">
              {config?.title || 'Potvrdit akci'}
            </h2>

            {/* Message */}
            {config?.message && (
              <p className="text-[14px] text-journeo-text-muted mb-8 leading-relaxed font-light">
                {config.message}
              </p>
            )}

            {/* Prompt input */}
            {config?.type === 'prompt' && (
              <div className="mb-8">
                <label className="block text-[11px] font-medium text-journeo-text-subtle mb-2 uppercase tracking-widest">
                  {config.inputLabel || 'Zadejte text pro potvrzení'}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.placeholder || ''}
                  className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-accent font-serif text-lg transition-colors duration-300"
                />
                {config.requiredPhrase && inputValue && inputValue !== config.requiredPhrase && (
                  <p className="text-[11px] text-red-400 mt-2 uppercase tracking-wide">
                    Napište přesně: <span className="font-serif italic capitalize">{config.requiredPhrase}</span>
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-journeo-border-strong">
              <button
                onClick={() => onCancel(false)}
                className="px-6 py-3 rounded-sm text-[13px] uppercase tracking-widest font-medium text-journeo-text-subtle hover:text-journeo-text transition-colors"
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
                className={`px-8 py-3 rounded-sm font-medium transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                  config?.variant === 'danger'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                    : 'bg-journeo-accent text-journeo-dark hover:bg-journeo-accent-hover'
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
