import { useEffect, useId, useState } from 'react';
import { X, Trash2, Loader2, MapPin, Check, Bookmark, Move } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CharCount from '../ui/CharCount';
import { PLACE_CATEGORIES, categoryLabelKey } from './placeConfig';

const NAME_MAX = 255;
const NOTE_MAX = 2000;

const emptyDraft = {
  name: '',
  category: 'sight',
  status: 'wishlist',
  note: '',
  tripId: null,
  dayIndex: null,
};

/**
 * Formulář místa. Sám o sobě nic nepřekrývá — obal si volí rodič:
 *  - `variant="panel"` sedí v postranním sloupci vedle mapy (desktop),
 *  - `variant="sheet"` běží uvnitř PlaceSheet jako bottom sheet (mobil).
 *
 * `place` je buď existující místo (má id), nebo rozpracovaný bod z kliku
 * do mapy / vyhledávání (lat, lng a případně předvyplněná adresa).
 */
const PlaceForm = ({
  place,
  trips = [],
  lockedTripId = null,
  dayCount = 0,
  isSaving = false,
  variant = 'sheet',
  isMoving = false,
  onToggleMove,
  onSave,
  onDelete,
  onClose,
}) => {
  const { t } = useTranslation();
  const fieldId = useId();
  const [form, setForm] = useState(emptyDraft);

  const isExisting = Boolean(place?.id);
  const isPanel = variant === 'panel';
  // Identita místa, ne identita objektu: rozpracovaný bod se přepisuje novým
  // objektem pokaždé, když dorazí adresa z geokódování nebo se špendlík
  // přesune jinam — formulář se kvůli tomu nesmí resetovat pod rukama.
  const placeKey = place ? (place.id ?? place.draftKey ?? `${place.lat},${place.lng}`) : null;

  useEffect(() => {
    if (!place) return;
    setForm({
      ...emptyDraft,
      ...place,
      name: place.name || '',
      note: place.note || '',
      category: place.category || 'sight',
      status: place.status || 'wishlist',
      tripId: place.tripId ?? lockedTripId ?? null,
      dayIndex: place.dayIndex ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, lockedTripId]);

  // Název z geokódování dorazí až po otevření panelu — doplníme ho jen
  // do prázdného pole, ať nepřepíšeme to, co už uživatel napsal.
  useEffect(() => {
    if (!place?.name) return;
    setForm((prev) => (prev.name ? prev : { ...prev, name: place.name }));
  }, [place?.name]);

  // Escape zavírá formulář v obou variantách (panel i sheet).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      // Nad formulářem může být potvrzovací dialog — ten Escape patří jemu,
      // jinak by se zavřely obě vrstvy najednou a editace by zmizela.
      if (document.querySelector('[data-dialog-open]')) return;
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!place) return null;

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || isSaving) return;
    onSave({
      ...form,
      name: form.name.trim(),
      note: form.note?.trim() || null,
      lat: place.lat,
      lng: place.lng,
      address: place.address ?? null,
      countryCode: place.countryCode ?? null,
      city: place.city ?? null,
      source: place.source || 'manual',
    });
  };

  const inputClass =
    'w-full px-4 py-3 sm:py-2.5 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-base sm:text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors';

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t(isExisting ? 'map.sheet.editTitle' : 'map.sheet.newTitle')}
      className="flex flex-col h-full min-h-0"
    >
      {/* Hlavička */}
      <div className={`flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-white/5 ${isPanel ? 'px-1 pt-1' : 'px-5 sm:px-6 pt-5'}`}>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">
            {t(isExisting ? 'map.sheet.editTitle' : 'map.sheet.newTitle')}
          </h2>
          <p className="mt-0.5 flex items-start gap-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400">
            <MapPin size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {place.address || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 -mr-1 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Obsah */}
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar py-5 space-y-5 ${isPanel ? 'px-1 pr-2' : 'px-5 sm:px-6'}`}>
        <div>
          <label htmlFor={`${fieldId}-name`} className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            {t('map.sheet.nameLabel')}
          </label>
          <input
            id={`${fieldId}-name`}
            // Na dotyku ne: klávesnice by hned zakryla celý sheet
            // i mapu pod ním. Na myši je fokus naopak úspora kliku.
            autoFocus={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
            value={form.name}
            maxLength={NAME_MAX}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={t('map.sheet.namePlaceholder')}
            className={inputClass}
          />
          <div className="mt-1 text-right">
            <CharCount value={form.name} max={NAME_MAX} />
          </div>
        </div>

        {/* Poloha — u uloženého místa se dá změnit, u rozepsaného ji stačí
            překlepnout do mapy (proto jen nápověda, ne přepínač). */}
        <div>
          <span className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            {t('map.sheet.locationLabel')}
          </span>
          <div className="flex items-center gap-2">
            <p className="flex-1 min-w-0 text-[12px] font-semibold text-gray-600 dark:text-gray-300 tabular-nums truncate">
              {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            </p>
            {isExisting && onToggleMove && (
              <button
                type="button"
                onClick={onToggleMove}
                aria-pressed={isMoving}
                className={`min-h-[36px] px-3 shrink-0 rounded-xl inline-flex items-center gap-1.5 text-[12px] font-semibold border transition-colors cursor-pointer ${
                  isMoving
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                <Move size={13} strokeWidth={2.5} aria-hidden="true" />
                {t(isMoving ? 'map.sheet.moveCancel' : 'map.sheet.move')}
              </button>
            )}
          </div>
          {(isMoving || !isExisting) && (
            <p className="mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {t(isExisting ? 'map.sheet.moveHint' : 'map.sheet.draftMoveHint')}
            </p>
          )}
        </div>

        {/* Stav */}
        <div>
          <span className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            {t('map.sheet.statusLabel')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'visited', icon: Check },
              { value: 'wishlist', icon: Bookmark },
            // eslint-disable-next-line no-unused-vars
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ status: value })}
                aria-pressed={form.status === value}
                className={`min-h-[44px] px-3 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-semibold border transition-colors cursor-pointer ${
                  form.status === value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                <Icon size={15} strokeWidth={2.5} aria-hidden="true" />
                <span className="truncate">{t(`map.statuses.${value}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Kategorie */}
        <div>
          <span className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            {t('map.sheet.categoryLabel')}
          </span>
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line no-unused-vars */}
            {PLACE_CATEGORIES.map(({ key, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => update({ category: key })}
                aria-pressed={form.category === key}
                style={form.category === key ? { borderColor: color, color } : undefined}
                className={`min-h-[44px] px-3.5 rounded-2xl flex items-center gap-2 text-[13px] font-semibold border transition-colors cursor-pointer ${
                  form.category === key
                    ? 'bg-white dark:bg-white/10 border-2'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <Icon size={15} strokeWidth={2.5} aria-hidden="true" />
                {t(categoryLabelKey(key))}
              </button>
            ))}
          </div>
        </div>

        {/* Výlet + den */}
        {!lockedTripId && trips.length > 0 && (
          <div>
            <label htmlFor={`${fieldId}-trip`} className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              {t('map.sheet.tripLabel')}
            </label>
            <select
              id={`${fieldId}-trip`}
              value={form.tripId ?? ''}
              onChange={(e) => update({ tripId: e.target.value || null, dayIndex: null })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">{t('map.sheet.noTrip')}</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {lockedTripId && dayCount > 0 && (
          <div>
            <label htmlFor={`${fieldId}-day`} className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              {t('map.sheet.dayLabel')}
            </label>
            <select
              id={`${fieldId}-day`}
              value={form.dayIndex ?? ''}
              onChange={(e) => update({ dayIndex: e.target.value === '' ? null : Number(e.target.value) })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">{t('map.sheet.noDay')}</option>
              {Array.from({ length: dayCount }, (_, i) => (
                <option key={i} value={i}>
                  {t('map.sheet.dayOption', { number: i + 1 })}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Poznámka */}
        <div>
          <label htmlFor={`${fieldId}-note`} className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            {t('map.sheet.noteLabel')}
          </label>
          <textarea
            id={`${fieldId}-note`}
            rows={3}
            value={form.note || ''}
            maxLength={NOTE_MAX}
            onChange={(e) => update({ note: e.target.value })}
            placeholder={t('map.sheet.notePlaceholder')}
            className={`${inputClass} resize-none`}
          />
          <div className="mt-1 text-right">
            <CharCount value={form.note || ''} max={NOTE_MAX} />
          </div>
        </div>
      </div>

      {/* Patička */}
      <div
        className={`flex items-center gap-3 py-4 border-t border-gray-100 dark:border-white/5 ${
          isPanel ? 'px-1' : 'px-5 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]'
        }`}
      >
        {isExisting && (
          <button
            type="button"
            onClick={() => onDelete(place)}
            aria-label={t('map.sheet.delete')}
            className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <Trash2 size={17} strokeWidth={2.5} />
          </button>
        )}
        <button
          type="submit"
          disabled={!form.name.trim() || isSaving}
          className="flex-1 min-h-[44px] rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {t(isExisting ? 'map.sheet.save' : 'map.sheet.create')}
        </button>
      </div>
    </form>
  );
};

export default PlaceForm;
