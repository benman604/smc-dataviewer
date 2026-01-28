"use client";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap, faCircleInfo, faDownload, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
// import "@luomus/leaflet-smooth-wheel-zoom";

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
  download?: React.ReactNode;
  animateView?: boolean;
}

export type MapHandle = {
  setPos: (center: [number, number], animate?: boolean) => void;
}

function ChangeView({ view, updateMapView, animate = true }: { view: MapView, updateMapView: boolean, animate?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    // Only attempt to set the view when the map container is connected
    const container = map.getContainer();
    if (!container || !container.isConnected) return;

    // Only set the view if it meaningfully differs from the current map view.
    // This prevents feedback loops where setView -> moveend -> parent setState -> re-render -> setView ...
    try {
      const c = map.getCenter();
      const z = map.getZoom();
      const [tlat, tlng] = view.center;
      const tzoom = view.zoom;
      const latDiff = Math.abs(c.lat - tlat);
      const lngDiff = Math.abs(c.lng - tlng);
      const zoomDiff = Math.abs(z - tzoom);
      const shouldSet = latDiff > 1e-5 || lngDiff > 1e-5 || zoomDiff > 1e-3;
      if (shouldSet) {
        map.setView(view.center, view.zoom, { animate });
      }
    } catch (err) {
      console.warn('ChangeView setView failed:', err);
    }
  }, [map, view, updateMapView, animate]);

  return null;
}

function MapEvents({ onViewChange }: { onViewChange?: (view: MapView & { bounds?: MapBounds }) => void }) {
  const map = useMap();
  const onViewChangeRef = useRef(onViewChange);
  const lastEmittedRef = useRef<MapView & { bounds?: MapBounds } | null>(null);
  const initializedRef = useRef(false);
  
  // Keep ref up to date
  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);
  
  useEffect(() => {
    const handler = () => {
      if (!onViewChangeRef.current) return;
      const c = map.getCenter();
      const b = map.getBounds();
      const newView = {
        center: [c.lat, c.lng] as [number, number],
        zoom: map.getZoom(),
        bounds: {
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        }
      } as MapView & { bounds?: MapBounds };

      const last = lastEmittedRef.current;
      let shouldEmit = true;
      if (last) {
        const latDiff = Math.abs(last.center[0] - newView.center[0]);
        const lngDiff = Math.abs(last.center[1] - newView.center[1]);
        const zoomDiff = Math.abs((last as any).zoom - newView.zoom);
        shouldEmit = latDiff > 1e-5 || lngDiff > 1e-5 || zoomDiff > 1e-3;
      }
      if (shouldEmit) {
        lastEmittedRef.current = newView;
        onViewChangeRef.current(newView);
      }
    };
    // Call handler once on mount to set initial bounds
    if (!initializedRef.current) {
      initializedRef.current = true;
      handler();
    }
    map.on('moveend', handler);
    map.on('zoomend', handler);
    return () => {
      map.off('moveend', handler);
      map.off('zoomend', handler);
    };
  }, [map]);
  return null;
}

function MapInit({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

const Map = forwardRef<MapHandle, MapProps>(function Map({ view, children, onViewChange, updateMapView, legend, animateView = true, download }: MapProps, ref) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
  const basemaps: Basemap = {
    osm: { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
    topo: { name: 'Topographic (Esri World Topo)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri, USGS, NOAA' },
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showBasemap, setShowBasemap] = useState<boolean>(false);
  const base = basemaps[basemap];
  
  // Clear any stale Leaflet instance on the container during hot reload
  // This fixes "Map container is being reused by another instance" error
  useEffect(() => {
    return () => {
      const container = containerRef.current;
      if (container) {
        // Remove Leaflet's internal marker that tracks if a map is initialized on this element
        // @ts-ignore - accessing internal Leaflet property
        delete container._leaflet_id;
      }
    };
  }, []);


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
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
    <MapContainer
      center={view.center}
      zoom={view.zoom}
      scrollWheelZoom={true}
      // @ts-ignore
      // smoothWheelZoom={true}
      smoothSensitivity={5}
      style={{ height: '100%', width: '100%' }}
    >
      <ChangeView view={view} updateMapView={updateMapView} animate={animateView} />
      <MapEvents onViewChange={onViewChange} />
      <MapInit mapRef={mapRef} />

        {base && (
          <TileLayer
            key={`base-${basemap}-${base.url}`}
            attribution={base.attribution ?? ''}
            url={base.url}
          />
        )}

        {base?.overlay && (
          <TileLayer
            key={`overlay-${basemap}-${base?.overlay?.url}`}
            attribution={base.overlay.attribution ?? ''}
            url={base.overlay.url}
          />
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
                  <input
                    type="radio"
                    name="basemap"
                    checked={basemap === (key as BasemapKey)}
                    onChange={() => setBasemap(key as BasemapKey)}
                  />
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

          {download && (
            <button
              className={`p-1 text-xl cursor-pointer text-stone-700 ${showBasemap ? "bg-black text-white" : "bg-white hover:bg-stone-200"}`}
              title="Download Data"
              onClick={() => {
                setShowBasemap((s) => !s);
                setShowLegend(false);
              }}
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
          )}
        </div>

      </div>
    </MapContainer>
    </div>
  );
});

export default Map;