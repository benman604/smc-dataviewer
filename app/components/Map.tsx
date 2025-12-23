"use client";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import "@luomus/leaflet-smooth-wheel-zoom";

export type MapView = {
  center: [number, number];
  zoom: number;
}

type MapProps = {
  view: MapView;
  children?: React.ReactNode;
  onViewChange?: (view: MapView) => void;
  updateMapView: boolean;
}

export type MapHandle = {
  setPos: (center: [number, number], animate?: boolean) => void;
}

function ChangeView({ view, updateMapView }: { view: MapView, updateMapView: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.setView(view.center, view.zoom);
  }, [updateMapView, map]);

  return null;
}

function MapEvents({ onViewChange }: { onViewChange?: (view: MapView) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onViewChange) return;
    const handler = () => {
      const c = map.getCenter();
      onViewChange({ center: [c.lat, c.lng], zoom: map.getZoom() });
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

const Map = forwardRef<MapHandle, MapProps>(function Map({ view, children, onViewChange, updateMapView }: MapProps, ref) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });

  const mapRef = useRef<L.Map | null>(null);

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
    >
      <ChangeView view={view} updateMapView={updateMapView} />
      <MapEvents onViewChange={onViewChange} />
      <MapInit mapRef={mapRef} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
});

export default Map;