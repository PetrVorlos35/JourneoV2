import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';

const PackingRow = ({ item, isViewer, onToggle, onDelete, t }) => (
  <li className="group flex items-center gap-3.5 py-2.5 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0">
    <button
      role="checkbox"
      aria-checked={item.checked}
      aria-labelledby={`packing-item-${item.id}`}
      disabled={isViewer}
      onClick={() => onToggle(item.id)}
      className={`relative w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors before:absolute before:-inset-2.5 before:content-[''] ${
        item.checked
          ? 'bg-accent border-blue-600 text-white'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
      } ${isViewer ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      {item.checked && <Check size={14} strokeWidth={3} aria-hidden="true" />}
    </button>
    <span
      id={`packing-item-${item.id}`}
      onClick={isViewer ? undefined : () => onToggle(item.id)}
      className={`flex-1 min-w-0 break-words text-[15px] font-medium transition-colors ${
        item.checked ? 'text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600' : 'text-primary'
      } ${isViewer ? '' : 'cursor-pointer'}`}
    >
      {item.text}
    </span>
    {!isViewer && (
      <button
        onClick={() => onDelete(item.id)}
        aria-label={t('tripDetail.packing.delete.title')}
        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer"
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>
    )}
  </li>
);

const PackingTool = ({ items, isViewer, onAdd, onToggle, onDelete }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [showPacked, setShowPacked] = useState(true);

  const toPack = items.filter((i) => !i.checked);
  const packed = items.filter((i) => i.checked);
  const progress = items.length ? (packed.length / items.length) * 100 : 0;

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  };

  return (
    <div className="max-w-2xl">
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[14px] font-semibold text-primary tabular-nums">
              {t('tripDetail.notebook.packingProgress', { done: packed.length, total: items.length })}
            </p>
            <p className="text-[13px] font-medium text-muted tabular-nums">{Math.round(progress)} %</p>
          </div>
          <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
            <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {!isViewer && (
        <form onSubmit={submit} className="flex gap-2 mb-6">
          <label htmlFor="new-packing-item" className="sr-only">{t('tripDetail.notebook.packingPlaceholder')}</label>
          <input
            id="new-packing-item"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={255}
            placeholder={t('tripDetail.notebook.packingPlaceholder')}
            className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-field border border-default text-base sm:text-[15px] font-medium text-primary placeholder:text-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-12 px-5 shrink-0 flex items-center gap-2 rounded-2xl bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-white/5 dark:disabled:text-gray-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">{t('tripDetail.notebook.add')}</span>
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="py-10 text-center text-[15px] font-medium text-muted">
          {t('tripDetail.notebook.packingEmpty')}
        </p>
      ) : (
        <>
          {toPack.length > 0 ? (
            <section>
              <h3 className="text-[13px] font-semibold text-muted mb-1">
                {t('tripDetail.notebook.toPack')} <span className="tabular-nums">· {toPack.length}</span>
              </h3>
              <ul>
                {toPack.map((item) => (
                  <PackingRow key={item.id} item={item} isViewer={isViewer} onToggle={onToggle} onDelete={onDelete} t={t} />
                ))}
              </ul>
            </section>
          ) : (
            <p className="py-4 text-[15px] font-semibold text-success">{t('tripDetail.notebook.allPacked')}</p>
          )}

          {packed.length > 0 && (
            <section className="mt-6">
              <button
                onClick={() => setShowPacked((v) => !v)}
                aria-expanded={showPacked}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-primary mb-1 py-1 cursor-pointer transition-colors"
              >
                {t('tripDetail.notebook.packed')} <span className="tabular-nums">· {packed.length}</span>
                <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform ${showPacked ? '' : '-rotate-90'}`} />
              </button>
              {showPacked && (
                <ul>
                  {packed.map((item) => (
                    <PackingRow key={item.id} item={item} isViewer={isViewer} onToggle={onToggle} onDelete={onDelete} t={t} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default PackingTool;
