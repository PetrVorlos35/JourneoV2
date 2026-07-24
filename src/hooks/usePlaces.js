import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

/**
 * Načtení a správa uložených míst. Sdílí ho globální mapa i mapa výletu,
 * aby CRUD logika (a optimistické úpravy seznamu) žila na jednom místě.
 *
 * `tripId` omezí načtená místa na jeden výlet; bez něj se načte všechno,
 * na co má uživatel nárok.
 */
export default function usePlaces({ tripId = null } = {}) {
  const { t } = useTranslation();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.places.getAll(tripId ? { tripId } : {});
      setPlaces(data.places || []);
    } catch (err) {
      toast.error(err.message || t('map.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Založí nové místo, nebo uloží změny existujícího (podle `id`).
  const savePlace = useCallback(
    async (payload) => {
      setSaving(true);
      try {
        if (payload.id) {
          const { place } = await api.places.update(payload.id, payload);
          setPlaces((prev) => prev.map((p) => (p.id === place.id ? place : p)));
          toast.success(t('map.toasts.updated'));
          return place;
        }

        const { place } = await api.places.create(payload);
        setPlaces((prev) => [...prev, place]);
        toast.success(t('map.toasts.created'));
        return place;
      } catch (err) {
        toast.error(err.message || t('map.errors.save'));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [t]
  );

  const deletePlace = useCallback(
    async (place) => {
      const previous = places;
      setPlaces((prev) => prev.filter((p) => p.id !== place.id));
      try {
        await api.places.remove(place.id);
        toast.success(t('map.toasts.deleted'));
        return true;
      } catch (err) {
        setPlaces(previous);
        toast.error(err.message || t('map.errors.delete'));
        return false;
      }
    },
    [places, t]
  );

  return { places, setPlaces, loading, saving, refresh, savePlace, deletePlace };
}
