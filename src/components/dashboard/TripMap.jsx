import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Route, DownloadCloud, Loader2 } from 'lucide-react';
import api from '../../services/api';
import useMapWorkspace from '../../hooks/useMapWorkspace';
import { routeDistanceKm, formatDistanceKm } from '../../utils/geo';
import MapWorkspaceView from '../map/MapWorkspaceView';

// Mapa jednoho výletu: místa navázaná na dny itineráře, spojnice mezi nimi
// a jednorázový import lokací, které si uživatel napsal k jednotlivým dnům.
// Immerzivní plocha (MapWorkspaceView) je stejná na mobilu i desktopu.
const TripMap = ({ trip, dayCount = 0, canEdit = true, onExit }) => {
  const { t, i18n } = useTranslation();
  const workspace = useMapWorkspace({ tripId: trip.id, canEdit });

  const { route, refresh, ModalPortal } = workspace;

  const [isImporting, setIsImporting] = useState(false);

  const totalDistance = useMemo(() => routeDistanceKm(route), [route]);

  // Geokódování běží na serveru s odstupem 1 s na dotaz, takže dlouhý
  // výlet přijde po dávkách — proto smyčka, dokud endpoint hlásí zbytek.
  const handleImport = async () => {
    setIsImporting(true);
    try {
      let imported = 0;
      let failed = 0;
      let remaining = 0;

      do {
        const result = await api.places.importItinerary(trip.id, i18n.language);
        imported += result.imported;
        failed += result.failed;
        remaining = result.remaining;
      } while (remaining > 0);

      await refresh();

      if (imported > 0) toast.success(t('map.trip.importDone', { count: imported }));
      else if (failed > 0) toast.error(t('map.trip.importFailed'));
      else toast(t('map.trip.importNothing'));
    } catch (err) {
      toast.error(err.message || t('map.trip.importError'));
    } finally {
      setIsImporting(false);
    }
  };

  const routeSummary = (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
      <Route size={16} strokeWidth={2.5} aria-hidden="true" />
      {route.length > 1
        ? t('map.trip.routeSummary', {
            count: route.length,
            distance: formatDistanceKm(totalDistance, i18n.language),
          })
        : t('map.trip.noRoute')}
    </div>
  );

  const importButton = canEdit ? (
    <button
      type="button"
      onClick={handleImport}
      disabled={isImporting}
      className="min-h-[44px] px-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:border-blue-400 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isImporting ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : (
        <DownloadCloud size={15} strokeWidth={2.5} aria-hidden="true" />
      )}
      {t('map.trip.import')}
    </button>
  ) : null;

  return (
    <>
      {ModalPortal}
      <MapWorkspaceView
        workspace={workspace}
        tripId={trip.id}
        dayCount={dayCount}
        canEdit={canEdit}
        title={trip.title}
        onBack={onExit}
        listExtra={
          <div className="flex flex-wrap items-center justify-between gap-3">
            {routeSummary}
            {importButton}
          </div>
        }
      />
    </>
  );
};

export default TripMap;
