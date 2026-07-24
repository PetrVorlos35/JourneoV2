import { useEffect, useState } from 'react';

// Media query jako stav. Používá se tam, kde nestačí schovat prvek přes CSS,
// protože se má vykreslit úplně jiná komponenta (např. formulář místa: na
// desktopu panel vedle mapy, na mobilu bottom sheet).
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
