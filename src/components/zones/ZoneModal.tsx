'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Coordinate, OperationalZone } from '../../types/catalogue';
import GoogleMapPolygonPicker from './GoogleMapPolygonPicker';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  zone?: OperationalZone | null;
  // Called after a successful create/update, before onClose — callers whose own zone list is no
  // longer sourced from CatalogueContext's full `zones` array (see ZonesView, which fetches its
  // own paginated page) use this to refetch instead of relying on the context array updating out
  // from under them.
  onSaved?: () => void;
}

// geojson.io exports either a bare Polygon/MultiPolygon geometry, a single Feature, or a
// FeatureCollection — pull the first polygon ring out of whichever shape shows up and drop
// the closing point (GeoJSON rings repeat the first point at the end; our backend's
// CreateZoneDto re-closes the ring itself, so an extra duplicate point isn't needed).
function parseGeoJsonToCoordinates(text: string): Coordinate[] {
  const json = JSON.parse(text);

  const extractRing = (geometry: any): number[][] | undefined => {
    if (!geometry) return undefined;
    if (geometry.type === 'Polygon') return geometry.coordinates?.[0];
    if (geometry.type === 'MultiPolygon') return geometry.coordinates?.[0]?.[0];
    return undefined;
  };

  let ring: number[][] | undefined;
  if (json.type === 'FeatureCollection') {
    for (const feature of json.features || []) {
      ring = extractRing(feature.geometry);
      if (ring) break;
    }
  } else if (json.type === 'Feature') {
    ring = extractRing(json.geometry);
  } else {
    ring = extractRing(json);
  }

  if (!ring || ring.length < 3) {
    throw new Error('No polygon found in that GeoJSON.');
  }

  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  const trimmed = firstLng === lastLng && firstLat === lastLat ? ring.slice(0, -1) : ring;

  return trimmed.map(([longitude, latitude]) => ({ latitude, longitude }));
}

export default function ZoneModal({ isOpen, onClose, mode, zone, onSaved }: ZoneModalProps) {
  const { createZone, updateZone } = useCatalogue();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [geoJsonText, setGeoJsonText] = useState('');
  const [showManualRows, setShowManualRows] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (isOpen) {
      setName(zone?.name || '');
      setCity(zone?.city || '');
      setIsActive(zone?.isActive !== false);
      setCoordinates([]);
      setGeoJsonText('');
      setShowManualRows(false);
    }
  }, [isOpen, zone]);

  if (!isOpen) return null;

  const handleParseGeoJson = () => {
    if (!geoJsonText.trim()) {
      toast.error('Paste the GeoJSON exported from geojson.io first');
      return;
    }
    try {
      const coords = parseGeoJsonToCoordinates(geoJsonText);
      setCoordinates(coords);
      toast.success(`Parsed ${coords.length} boundary points`);
    } catch (err: any) {
      toast.error(err.message || 'Could not parse that GeoJSON');
    }
  };

  const addManualPoint = () => setCoordinates((prev) => [...prev, { latitude: 0, longitude: 0 }]);
  const updateManualPoint = (idx: number, field: keyof Coordinate, value: string) => {
    setCoordinates((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: Number(value) || 0 } : c)));
  };
  const removeManualPoint = (idx: number) => setCoordinates((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      toast.error('Name and city are required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && zone) {
        const res = await updateZone(zone.id, { name, city, isActive });
        if (res.ok) {
          toast.success('Zone updated!');
          onSaved?.();
          onClose();
        } else {
          toast.error(res.message || 'Failed to update zone');
        }
      } else {
        if (coordinates.length < 3) {
          toast.error('Draw, paste, or enter at least 3 boundary points first');
          return;
        }
        const res = await createZone({ name, city, coordinates });
        if (res.ok) {
          toast.success('Zone created!');
          onSaved?.();
          onClose();
        } else {
          toast.error(res.message || 'Failed to create zone');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl p-8 shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-transform active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
          {isEdit ? 'Edit Zone' : 'Create Zone'}
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          {isEdit
            ? "Name, city and status only — a zone's boundary can't be redrawn after creation."
            : 'Draw the service area boundary, then give it a name and city.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Los Angeles"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                City<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Los Angeles"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              />
            </div>
          </div>

          {isEdit ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                <select
                  value={isActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'Active')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF5F0] border border-[#F2E5D9] text-xs text-gray-600">
                Coverage: <span className="font-semibold text-gray-900">{zone?.hexes?.length ?? 0} hex cells</span>.
                To change the boundary, create a new zone with the corrected shape and delete this one.
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Zone Boundary<span className="text-red-500">*</span></label>
                <a
                  href="https://geojson.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C68A4C] hover:text-[#a86f38]"
                >
                  Draw on geojson.io <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <GoogleMapPolygonPicker
                coordinates={coordinates}
                onChange={setCoordinates}
                apiKey={GOOGLE_MAPS_API_KEY}
              />

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  ...or paste GeoJSON exported from geojson.io
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    placeholder='{"type":"FeatureCollection","features":[...]}'
                    value={geoJsonText}
                    onChange={(e) => setGeoJsonText(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                  />
                  <button
                    type="button"
                    onClick={handleParseGeoJson}
                    className="px-4 rounded-xl bg-[#1C1512] text-white text-xs font-medium hover:bg-black self-stretch"
                  >
                    Parse
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowManualRows((v) => !v)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  {showManualRows ? '- Hide' : '+ Show'} manual lat/long entry ({coordinates.length} points)
                </button>

                {showManualRows && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {coordinates.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-5">{idx + 1}</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={c.latitude}
                          onChange={(e) => updateManualPoint(idx, 'latitude', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={c.longitude}
                          onChange={(e) => updateManualPoint(idx, 'longitude', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                        />
                        <button
                          type="button"
                          onClick={() => removeManualPoint(idx)}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addManualPoint}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#C68A4C] hover:text-[#a86f38] pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add point
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#221812] text-white font-medium text-sm hover:bg-black transition-colors shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
