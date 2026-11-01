import { useEffect, useState } from 'react';
import { getInstallMode, subscribe } from '../utils/pwaInstall';

// Aktuální režim instalace; přepočítá se, když prohlížeč pošle
// beforeinstallprompt / appinstalled nebo když se karta zavře.
const usePwaInstall = () => {
  const [mode, setMode] = useState(getInstallMode);
  const [, force] = useState(0);
  useEffect(() => subscribe(() => { setMode(getInstallMode()); force((n) => n + 1); }), []);
  return mode;
};

export default usePwaInstall;
