import { useState, useEffect } from 'react';

export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

export interface GpsState {
  position: GpsPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGpsPosition(): GpsState {
  const [state, setState] = useState<GpsState>({ position: null, error: null, loading: true });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: 'GPS not available in this browser', loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setState({
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        error: null,
        loading: false,
      }),
      (err) => setState(prev => ({ ...prev, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
