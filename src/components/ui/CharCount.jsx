const CharCount = ({ value = '', max }) => {
  const len = (value ?? '').length;
  const pct = len / max;
  return (
    <span className={`text-[11px] font-semibold tabular-nums transition-colors duration-200 select-none ${
      pct >= 0.95 ? 'text-red-500' : pct >= 0.8 ? 'text-amber-500' : 'text-gray-400 dark:text-white/30'
    }`}>
      {len} / {max}
    </span>
  );
};

export default CharCount;
