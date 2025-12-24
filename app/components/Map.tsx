"use client";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import "@luomus/leaflet-smooth-wheel-zoom";

export type MapView = {
  center: [number, number];
  zoom: number;
}

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type Basemap = Record<string, {
  name: string;
  url: string;
  attribution?: string;
  overlay?: { url: string; attribution?: string } | null;
}>;

type MapProps = {
  view: MapView;
  children?: React.ReactNode;
  onViewChange?: (view: MapView) => void;
  updateMapView: boolean;
  legend?: React.ReactNode;
}

export type MapHandle = {
  setPos: (center: [number, number], animate?: boolean) => void;
}

function ChangeView({ view, updateMapView }: { view: MapView, updateMapView: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    // Check if map container exists and is connected to the DOM
    const container = map.getContainer();
    if (!container || !container.isConnected) return;
    
    // Additional check: ensure the map is properly initialized
    // by verifying internal Leaflet structures exist
    try {
      // This will throw if map's internal state is corrupted
      map.getCenter();
      map.setView(view.center, view.zoom);
    } catch (error) {
      // Map is in an invalid state (common during hot reload)
      // Silently ignore - the map will reinitialize on next render
      console.warn("Map setView failed (likely due to hot reload):", error);
    }
  }, [updateMapView, map]);

  return null;
}

function MapEvents({ onViewChange }: { onViewChange?: (view: MapView & { bounds?: MapBounds }) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onViewChange) return;
    const handler = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      onViewChange({
        center: [c.lat, c.lng],
        zoom: map.getZoom(),
        bounds: {
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        }
      });
    };
    map.on('moveend', handler);
    map.on('zoomend', handler);
    return () => {
      map.off('moveend', handler);
      map.off('zoomend', handler);
    };
  }, [map, onViewChange]);
  return null;
}

function MapInit({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap, faCircleInfo, faTimes, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

const Map = forwardRef<MapHandle, MapProps>(function Map({ view, children, onViewChange, updateMapView, legend }: MapProps, ref) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
  const basemaps: Basemap = {
    osm: { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
    topo: { name: 'Topographic (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap contributors' },
    sat:   { 
      name: "Satellite (Esri)",
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
      overlay: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri"
      },
    },
  };
  type BasemapKey = keyof typeof basemaps;

  const mapRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showBasemap, setShowBasemap] = useState<boolean>(false);
  
  // Track map instance ID to detect when we need to recreate the map
  // This helps during hot reload situations
  const [mapInstanceId] = useState(() => Math.random().toString(36).substring(7));


  useImperativeHandle(ref, () => ({
    setPos(center: [number, number], animate = false) {
      const m = mapRef.current;
      if (!m) return;
      const z = m.getZoom();
      if (animate) m.flyTo(center as L.LatLngExpression, z);
      else m.setView(center as L.LatLngExpression, z, { animate: false });
    }
  }), []);

  return (
    <MapContainer
      center={view.center}
      zoom={view.zoom}
      scrollWheelZoom={false}
      // @ts-ignore
      smoothWheelZoom={true}
      smoothSensitivity={10}
      style={{ height: '100%', width: '100%' }}
      key={mapInstanceId}
    >
      <ChangeView view={view} updateMapView={updateMapView} />
      <MapEvents onViewChange={onViewChange} />
      <MapInit mapRef={mapRef} />
      <TileLayer attribution={basemaps[basemap].attribution ?? ''} url={basemaps[basemap].url} key={"base-" + basemap} />
      {basemaps[basemap].overlay && (
        <TileLayer attribution={basemaps[basemap].overlay!.attribution ?? ''} url={basemaps[basemap].overlay!.url} key={"overlay-" + basemap} />
      )}

      {children}

      {/* Floating controls (lower-left) */}
      <div className="absolute left-4 bottom-4 z-50 flex flex-col gap-2" style={{zIndex: 10000000}}>
          {showLegend && (
            <div className="w-48 p-2 bg-white/95 text-sm text-stone-700">
              {legend && React.isValidElement(legend)
                ? React.cloneElement(legend as any, { onClose: () => setShowLegend(false) })
                : legend}
            </div>
          )}

        {/* Basemap selector panel */}
        {showBasemap && (
          <div className="w-44 p-2 bg-white/95 text-sm text-stone-700">
            <div className="flex justify-between items-center">
              <div className="font-medium">Basemap</div>
              <button className="text-stone-500 cursor-pointer" onClick={() => setShowBasemap(false)}><FontAwesomeIcon icon={faCircleXmark} /></button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {Object.entries(basemaps).map(([key, bm]) => (
                <label key={key} className="flex items-center gap-2 text-xs">
                  <input type="radio" name="basemap" checked={basemap === key} onChange={() => setBasemap(key)} />
                  <div>{bm.name}</div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className={`p-1 text-xl cursor-pointer text-stone-700 ${showLegend ? "bg-black text-white" : "bg-white hover:bg-stone-200"}`}
            title="Legend"
            onClick={() => {
              setShowLegend((s) => !s);
              setShowBasemap(false);
            }}
          >
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>

          <button
            className={`p-1 text-xl cursor-pointer text-stone-700 ${showBasemap ? "bg-black text-white" : "bg-white hover:bg-stone-200"}`}
            title="Basemap"
            onClick={() => {
              setShowBasemap((s) => !s);
              setShowLegend(false);
            }}
          >
            <FontAwesomeIcon icon={faMap} />
          </button>
        </div>

      </div>
    </MapContainer>
  );
});

export default Map;