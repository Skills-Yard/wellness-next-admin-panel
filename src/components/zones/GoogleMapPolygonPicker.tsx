'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Coordinate } from '../../types/catalogue';

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadPromise?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  if (window.google?.maps?.drawing) return Promise.resolve();
  if (window.__googleMapsLoadPromise) return window.__googleMapsLoadPromise;

  window.__googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=drawing`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps JS SDK — check the API key and that Maps JavaScript API is enabled.'));
    document.head.appendChild(script);
  });

  return window.__googleMapsLoadPromise;
}

interface GoogleMapPolygonPickerProps {
  coordinates: Coordinate[];
  onChange: (coords: Coordinate[]) => void;
  apiKey?: string;
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India, roughly centered
const POLYGON_STYLE = {
  fillColor: '#C68A4C',
  fillOpacity: 0.25,
  strokeColor: '#C68A4C',
  strokeWeight: 2,
  editable: true,
};

export default function GoogleMapPolygonPicker({ coordinates, onChange, apiKey }: GoogleMapPolygonPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  // Tracks the JSON of the last coordinates value WE emitted via onChange, so the
  // external-sync effect below can tell "the parent echoed our own edit back to us"
  // (skip — the map already reflects this) apart from "the parent changed it externally"
  // (paste / manual rows — redraw the polygon). Comparing values rather than relying on
  // effect-ordering timing keeps this correct regardless of how React schedules the update.
  const lastEmittedRef = useRef<string>('[]');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const emitFromPolygon = useCallback((polygon: any) => {
    const path = polygon.getPath();
    const coords: Coordinate[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ latitude: point.lat(), longitude: point.lng() });
    }
    lastEmittedRef.current = JSON.stringify(coords);
    onChange(coords);
  }, [onChange]);

  const attachPolygonListeners = useCallback((polygon: any) => {
    const google = window.google;
    const path = polygon.getPath();
    ['insert_at', 'remove_at', 'set_at'].forEach((evt) => {
      google.maps.event.addListener(path, evt, () => emitFromPolygon(polygon));
    });
  }, [emitFromPolygon]);

  const drawPolygon = useCallback((coords: Coordinate[]) => {
    const google = window.google;
    const map = mapRef.current;
    if (!google || !map) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    if (coords.length === 0) {
      drawingManagerRef.current?.setOptions({ drawingControl: true });
      drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      return;
    }

    const path = coords.map((c) => ({ lat: c.latitude, lng: c.longitude }));
    const polygon = new google.maps.Polygon({ ...POLYGON_STYLE, paths: path, map });
    polygonRef.current = polygon;
    attachPolygonListeners(polygon);
    drawingManagerRef.current?.setOptions({ drawingControl: false });
    drawingManagerRef.current?.setDrawingMode(null);

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p: { lat: number; lng: number }) => bounds.extend(p));
    map.fitBounds(bounds);
  }, [attachPolygonListeners]);

  const handleClear = useCallback(() => {
    lastEmittedRef.current = '[]';
    onChange([]);
  }, [onChange]);

  // Init map + drawing manager once.
  useEffect(() => {
    if (!apiKey) {
      setStatus('error');
      setErrorMsg('No Google Maps API key configured (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env).');
      return;
    }
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        const google = window.google;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: coordinates.length ? null : google.maps.drawing.OverlayType.POLYGON,
          drawingControl: coordinates.length === 0,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: POLYGON_STYLE,
        });
        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: any) => {
          if (polygonRef.current) polygonRef.current.setMap(null);
          polygonRef.current = polygon;
          drawingManager.setDrawingMode(null);
          drawingManager.setOptions({ drawingControl: false });
          attachPolygonListeners(polygon);
          emitFromPolygon(polygon);
        });

        if (coordinates.length > 0) {
          lastEmittedRef.current = JSON.stringify(coordinates);
          drawPolygon(coordinates);
        }

        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err.message);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally only re-running this on apiKey change — the map/drawing manager are
    // created once; coordinate updates after that are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Redraw the polygon when coordinates change from OUTSIDE the map (pasted GeoJSON, manual
  // lat/long rows). Skips redraws that are just this component's own edit echoed back.
  useEffect(() => {
    if (status !== 'ready') return;
    const json = JSON.stringify(coordinates);
    if (json === lastEmittedRef.current) return;
    lastEmittedRef.current = json;
    drawPolygon(coordinates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, status]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        className="w-full h-72 rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center"
      >
        {status === 'loading' && <span className="text-xs text-gray-400">Loading map...</span>}
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
      {status === 'ready' && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {coordinates.length > 0
              ? `${coordinates.length} points — drag vertices to adjust.`
              : 'Click the polygon tool on the map to draw the zone boundary.'}
          </span>
          {coordinates.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="font-medium text-red-500 hover:text-red-700"
            >
              Clear & redraw
            </button>
          )}
        </div>
      )}
    </div>
  );
}
