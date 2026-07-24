import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, animate, useDragControls, useMotionValue, useReducedMotion } from 'framer-motion';

// Výšky jednotlivých poloh sheetu. `bar` je úzký pruh pro režim umisťování,
// `peek` náhled s vybraným místem, `half` a `full` pro seznam a formulář.
const SNAP_HEIGHTS = {
  bar: () => 92,
  peek: () => 150,
  half: (vh) => Math.round(vh * 0.5),
  full: (vh) => Math.round(vh * 0.88),
};

const useViewportHeight = () => {
  const [height, setHeight] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return height;
};

/**
 * Tažený bottom sheet se snap polohami — mobilní protějšek postranního
 * panelu na desktopu. Záměrně bez ztmaveného pozadí: mapa pod ním musí
 * zůstat vidět i ovladatelná.
 *
 * Táhne se **jen za úchyt v hlavičce** (dragListener je vypnutý a spouští
 * ho pointer na úchytu), takže scrollování obsahu uvnitř sheet neposouvá.
 *
 * Props:
 *  - snap        aktuální poloha ('bar' | 'peek' | 'half' | 'full')
 *  - onSnapChange(next)  změna polohy tažením
 *  - snapPoints  povolené polohy, odspodu nahoru
 *  - header      obsah viditelný i v náhledu (součást úchytu)
 *  - children    obsah viditelný po roztažení
 *  - bodyScroll  false = scrollování si řídí obsah sám (formulář místa)
 */
const BottomSheet = ({
  snap = 'peek',
  onSnapChange,
  snapPoints = ['peek', 'half', 'full'],
  header,
  children,
  bodyScroll = true,
  ariaLabel,
}) => {
  const viewportHeight = useViewportHeight();
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  const fullHeight = SNAP_HEIGHTS.full(viewportHeight);

  // Poloha sheetu = posun dolů od plné výšky.
  const offsets = useMemo(() => {
    const map = {};
    for (const point of snapPoints) {
      const height = SNAP_HEIGHTS[point]?.(viewportHeight) ?? SNAP_HEIGHTS.peek();
      map[point] = Math.max(0, fullHeight - height);
    }
    return map;
  }, [snapPoints, viewportHeight, fullHeight]);

  const currentOffset = offsets[snap] ?? offsets[snapPoints[0]] ?? 0;

  useEffect(() => {
    const controls = animate(y, currentOffset, {
      type: shouldReduceMotion ? 'tween' : 'spring',
      duration: shouldReduceMotion ? 0 : undefined,
      damping: 30,
      stiffness: 300,
    });
    return () => controls.stop();
  }, [currentOffset, shouldReduceMotion, y]);

  const handleDragEnd = (_event, info) => {
    // Rychlé mávnutí prstem má přednost před vzdáleností — promítneme,
    // kam by sheet doletěl, a chytneme nejbližší povolenou polohu.
    const projected = y.get() + info.velocity.y * 0.15;
    const nearest = snapPoints.reduce((best, point) =>
      Math.abs(offsets[point] - projected) < Math.abs(offsets[best] - projected) ? point : best
    );

    if (nearest !== snap) onSnapChange?.(nearest);
    else animate(y, currentOffset, { type: 'spring', damping: 30, stiffness: 300 });
  };

  const dragBounds = useMemo(() => {
    const values = snapPoints.map((point) => offsets[point]);
    return { top: Math.min(...values), bottom: Math.max(...values) };
  }, [snapPoints, offsets]);

  const canDrag = snapPoints.length > 1;

  return (
    <motion.section
      role="region"
      aria-label={ariaLabel}
      style={{ y, height: fullHeight }}
      drag={canDrag ? 'y' : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={dragBounds}
      dragElastic={0.04}
      onDragEnd={handleDragEnd}
      className="absolute inset-x-0 bottom-0 z-[20] flex flex-col rounded-t-[1.75rem] bg-[#fbfbfd] dark:bg-[#1C1C1E] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.35)] border-t border-black/5 dark:border-white/10"
    >
      {/* Úchyt + obsah náhledu — jediná oblast, za kterou se sheet táhne. */}
      <div
        onPointerDown={(event) => {
          // Tlačítka v náhledu (Upravit, Přesunout, …) leží uvnitř úchytu —
          // na nich nesmí začít tažení, jinak by se klepnutí občas ztratilo.
          if (event.target.closest('button, a, input, select, textarea, label')) return;
          if (canDrag) dragControls.start(event);
        }}
        className={`shrink-0 ${canDrag ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
      >
        {canDrag && (
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="block w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" aria-hidden="true" />
          </div>
        )}
        {header}
      </div>

      <div
        className={`flex-1 min-h-0 px-4 ${
          bodyScroll
            ? 'overflow-y-auto overscroll-contain custom-scrollbar pb-[max(1rem,env(safe-area-inset-bottom))]'
            : 'overflow-hidden'
        }`}
      >
        {children}
      </div>
    </motion.section>
  );
};

export { SNAP_HEIGHTS };
export default BottomSheet;
