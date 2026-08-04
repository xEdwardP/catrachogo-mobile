import { useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

const EPSILON = 1e-9;

function isSamePosition(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < EPSILON && Math.abs(a.lng - b.lng) < EPSILON;
}

export function useSmoothedPosition(target: LatLng | null, durationMs = 3000): LatLng | null {
  const [display, setDisplay] = useState<LatLng | null>(target);
  const displayRef = useRef<LatLng | null>(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    if (!target) {
      frameRef.current = requestAnimationFrame(() => {
        displayRef.current = null;
        setDisplay(null);
      });
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }

    const from = displayRef.current;
    if (!from || isSamePosition(from, target)) {
      frameRef.current = requestAnimationFrame(() => {
        displayRef.current = target;
        setDisplay(target);
      });
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }

    const startTime = Date.now();

    function step(now: number) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = {
        lat: from!.lat + (target!.lat - from!.lat) * eased,
        lng: from!.lng + (target!.lng - from!.lng) * eased,
      };
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    }
    frameRef.current = requestAnimationFrame(() => step(Date.now()));

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return display;
}
