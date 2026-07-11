import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Public pages (landing, auth, legal) are always light regardless of the
// user's app theme. Holds a light-lock in ThemeContext while mounted, so the
// `dark` class stays off even when the theme loads asynchronously from the
// backend; the dashboard gets the chosen theme back on unmount.
const useForceLightTheme = () => {
  const { lockLightTheme, unlockLightTheme } = useTheme();
  useEffect(() => {
    lockLightTheme();
    return unlockLightTheme;
  }, [lockLightTheme, unlockLightTheme]);
};

export default useForceLightTheme;
