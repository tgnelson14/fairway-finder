import { useState, useCallback } from 'react';

export interface HolePin { lat: number; lng: number }
type PinStore = Record<string, HolePin>;

const STORAGE_KEY = 'ff-hole-pins-v1';

function load(): PinStore {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function useHolePins(courseId: string) {
  const [pins, setPins] = useState<PinStore>(load);

  const getPin = useCallback((holeNumber: number): HolePin | null =>
    pins[`${courseId}-h${holeNumber}`] ?? null,
  [courseId, pins]);

  const setPin = useCallback((holeNumber: number, coord: HolePin) => {
    setPins(prev => {
      const next = { ...prev, [`${courseId}-h${holeNumber}`]: coord };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [courseId]);

  const clearPin = useCallback((holeNumber: number) => {
    setPins(prev => {
      const next = { ...prev };
      delete next[`${courseId}-h${holeNumber}`];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [courseId]);

  return { getPin, setPin, clearPin };
}
