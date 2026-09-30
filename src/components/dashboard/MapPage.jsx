import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMapWorkspace from '../../hooks/useMapWorkspace';
import { useOpenMobileMenu } from '../../contexts/MobileMenuContext';
import MapWorkspaceView from '../map/MapWorkspaceView';
import { getDashboardNavItems, MOBILE_PRIMARY_PATHS } from './navItems';

// Globální mapa: všechna místa uživatele napříč výlety na jednom plátně.
// Immerzivní plocha (MapWorkspaceView) je stejná na mobilu i desktopu — jen
// panel s informacemi je jednou tažený sheet, jednou plovoucí boční panel.
const MapPage = ({ trips = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = useMapWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const openMobileMenu = useOpenMobileMenu();

  const editableTrips = useMemo(() => trips.filter((trip) => trip.role !== 'viewer'), [trips]);

  // ?place=<id> zaměří a otevře konkrétní místo — sem míří výsledky
  // Spotlightu. Parametr po použití zahodíme, ať se výběr nevrací zpátky,
  // až se uživatel na mapě proklikne jinam.
  const placeParam = searchParams.get('place');
  const { places, loading, focusPlace } = workspace;
  useEffect(() => {
    if (!placeParam || loading) return;
    const place = places.find((p) => String(p.id) === placeParam);
    if (place) focusPlace(place);
    setSearchParams({}, { replace: true });
  }, [placeParam, loading, places, focusPlace, setSearchParams]);

  const mobileNavItems = useMemo(
    () => getDashboardNavItems(t).filter((item) => MOBILE_PRIMARY_PATHS.includes(item.path)),
    [t]
  );

  return (
    <>
      {workspace.ModalPortal}
      <MapWorkspaceView
        workspace={workspace}
        trips={editableTrips}
        title={t('map.title')}
        // Šipka couvá tam, odkud uživatel přišel (Výdaje, Přehled, …), ne
        // natvrdo na Přehled — `location.key === 'default'` značí vstup bez
        // vlastní historie (přímý odkaz/refresh), kde je Přehled jediná
        // rozumná záloha.
        onBack={() => (location.key === 'default' ? navigate('/dashboard') : navigate(-1))}
        onOpenMenu={openMobileMenu}
        mobileNav={{
          items: mobileNavItems,
          activePath: '/dashboard/map',
          onNavigate: (path) => navigate(path),
        }}
        // Mapa se protahuje pod plovoucí navigační sidebar (šířka 280px) —
        // panel a centrování se o tuhle šířku posunou, ať nic nezmizí pod ním.
        leftInset={280}
      />
    </>
  );
};

export default MapPage;
