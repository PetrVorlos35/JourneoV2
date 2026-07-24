import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { getCategory, categoryLabelKey } from './placeConfig';

// Seznam míst vedle mapy. Klik na řádek na místo přeletí, tužka ho otevře
// k úpravě — stejné rozdělení jako u ostatních seznamů v dashboardu.
const PlaceList = ({ places, selectedId, onSelect, onEdit, emptyLabel, canEdit = true }) => {
  const { t } = useTranslation();

  if (places.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] font-medium text-gray-400 dark:text-gray-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {places.map((place) => {
        const { icon: Icon, color } = getCategory(place.category);
        const isSelected = String(place.id) === String(selectedId);

        return (
          <li key={place.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(place)}
              className={`w-full min-h-[44px] text-left pl-3 pr-12 py-2.5 rounded-2xl flex items-start gap-3 border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                  : 'bg-white/60 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
              }`}
            >
              <span
                className="mt-0.5 w-7 h-7 shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}22`, color }}
              >
                <Icon size={15} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-gray-900 dark:text-white truncate">
                  {place.name}
                </span>
                <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                  {[
                    t(`map.statuses.${place.status}`),
                    t(categoryLabelKey(place.category)),
                    place.dayIndex != null ? t('map.sheet.dayOption', { number: place.dayIndex + 1 }) : null,
                    place.tripTitle,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(place)}
                aria-label={t('map.list.edit', { name: place.name })}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 cursor-pointer"
              >
                <Pencil size={15} strokeWidth={2.5} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default PlaceList;
