import { useEffect, useRef, memo } from "react";
import createGlobe from "cobe";

const DEFAULT_MARKERS = [];
const DEFAULT_ARCS = [];
const DEFAULT_MARKER_COLOR = [0.3, 0.45, 0.85];
const DEFAULT_BASE_COLOR = [0.1, 0.1, 0.2];
const DEFAULT_ARC_COLOR = [0.3, 0.45, 0.85];
const DEFAULT_GLOW_COLOR = [0.2, 0.3, 0.5];

export const Globe = memo(function Globe({
  markers = DEFAULT_MARKERS,
  arcs = DEFAULT_ARCS,
  className = "",
  markerColor = DEFAULT_MARKER_COLOR,
  baseColor = DEFAULT_BASE_COLOR,
  arcColor = DEFAULT_ARC_COLOR,
  glowColor = DEFAULT_GLOW_COLOR,
  dark = 1,
  mapBrightness = 6,
  markerSize = 0.05,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.25,
  speed = 0.003,
  theta = 0.3,
  diffuse = 1.2,
  mapSamples = 10000,
}) {
  const canvasRef = useRef(null);
  const phiRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe = null;
    let animationId;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: phiRef.current,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markers.map((m) => ({
          location: m.location,
          size: markerSize,
        })),
        arcs: arcs.map((a) => ({
          from: a.from,
          to: a.to,
        })),
        arcColor,
        arcWidth,
        arcHeight,
        opacity: 0.9,
      });

      function animate() {
        phiRef.current += speed;
        globe.update({
          phi: phiRef.current,
          theta: theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = "1"));
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [markers, arcs, markerColor, baseColor, arcColor, glowColor, dark, mapBrightness, markerSize, markerElevation, arcWidth, arcHeight, speed, theta, diffuse, mapSamples]);

  return (
    <div className={`relative aspect-square select-none pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
        }}
      />
    </div>
  );
});
