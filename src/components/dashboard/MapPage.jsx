import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMapWorkspace from '../../hooks/useMapWorkspace';
import MapWorkspaceView from '../map/MapWorkspaceView';

// Globální mapa: všechna místa uživatele napříč výlety na jednom plátně.
// Immerzivní plocha (MapWorkspaceView) je stejná na mobilu i desktopu — jen
// panel s informacemi je jednou tažený sheet, jednou plovoucí boční panel.
const MapPage = ({ trips = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspace = useMapWorkspace();

  const editableTrips = useMemo(() => trips.filter((trip) => trip.role !== 'viewer'), [trips]);

  return (
    <>
      {workspace.ModalPortal}
      <MapWorkspaceView
        workspace={workspace}
        trips={editableTrips}
        title={t('map.title')}
        onBack={() => navigate('/dashboard')}
        // Mapa se protahuje pod plovoucí navigační sidebar (šířka 280px) —
        // panel a centrování se o tuhle šířku posunou, ať nic nezmizí pod ním.
        leftInset={280}
      />
    </>
  );
};

export default MapPage;
