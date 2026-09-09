"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { BirthSky3D } from "@/features/kundali/components/birth-sky-3d";
import { BODIES } from "@/features/marketing/ephemeris";
import { getSky, subscribeSky } from "@/features/marketing/store/sky";
import type { Chart } from "@/features/kundali/types";

/**
 * The hero's sky is the /sky page's scene, fed the current minute instead of
 * a birth — which is exactly what the headline over it promises. The
 * positions come from the same live ephemeris the hero's D1/D9 badges read,
 * frozen at first paint: the scene is rebuilt when its chart changes, and
 * planets do not visibly move within a visit.
 */
export function HeroSky() {
  const live = useSyncExternalStore(
    (cb) => subscribeSky(() => cb()),
    getSky,
    () => null,
  );
  const [selected, setSelected] = useState<string | null>(null);

  const ready = live !== null;
  const chart = useMemo(() => {
    if (!live) return null;
    const jd = live.at.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    // The marketing ephemeris' own Lahiri series, so the yogataras sit in
    // the same frame as the planets around them.
    const ayanamsa = 23.85 + 1.3972 * T;
    const planets = BODIES.map((name) => {
      const lon = live[name];
      return {
        name,
        sign_index: Math.floor(lon / 30) % 12,
        degree_in_sign: lon % 30,
        retrograde: false,
        combust: false,
      };
    });
    // Only what the scene reads: planets, the lagna, the ayanamsa.
    return {
      planets,
      lagna_sign_index: Math.floor(live.Lagna / 30) % 12,
      lagna_degree: live.Lagna % 30,
      ayanamsa_value: ayanamsa,
    } as unknown as Chart;
    // Frozen deliberately: depending on `live` would rebuild the WebGL scene
    // every tick for sub-arcsecond motion nobody can see.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!chart) return null;

  return (
    <BirthSky3D
      chart={chart}
      selected={selected}
      onSelect={(name) => setSelected((s) => (s === name ? null : name))}
      showNakshatras={false}
      showAspects={false}
      wheelZoom={false}
      animateOrbits
      globalInteract
      subtleRing
      avoidSelector="[data-sky-avoid]"
      className="absolute inset-0 h-full w-full overflow-hidden"
    />
  );
}
