import React, { useRef } from 'react';

/**
 * Rozdělený input pro ověřovací kód – jedno políčko na číslici.
 * Podporuje psaní číslo po čísle (auto-posun), mazání backspacem,
 * pohyb šipkami i vložení celého kódu (paste).
 *
 * Controlled komponenta: drží se řetězce `value` a hlásí změny
 * přes `onChange(newValue)`.
 */
const OtpInput = ({ value = '', onChange, length = 6, autoFocus = false, disabled = false }) => {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focusIndex = (i) => {
    const el = inputsRef.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (i, raw) => {
    const onlyDigits = raw.replace(/\D/g, '');
    const next = digits.slice();

    if (!onlyDigits) {
      next[i] = '';
      onChange(next.join(''));
      return;
    }

    // Více číslic naráz (rychlé psaní / autofill) rozprostři od aktuálního pole
    let idx = i;
    for (const c of onlyDigits.split('')) {
      if (idx >= length) break;
      next[idx] = c;
      idx++;
    }
    onChange(next.join('').slice(0, length));
    focusIndex(Math.min(idx, length - 1));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice();
      if (digits[i]) {
        next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) {
        next[i - 1] = '';
        onChange(next.join(''));
        focusIndex(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      focusIndex(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      focusIndex(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Číslice ${i + 1}`}
          maxLength={1}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
};

export default OtpInput;
