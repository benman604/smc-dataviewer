"use client";
import { Polygon, Tooltip } from 'react-leaflet';
import { SHAKEMAP_THRESHOLD_EXCEPTIONS } from '../lib/util';

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

export default function ShakemapPolygons() {
  return (
    <>
      {SHAKEMAP_THRESHOLD_EXCEPTIONS.map((region: any, idx: number) => (
        <Polygon
          key={region.name}
          positions={region.polygon.map((p: any) => [p.lat, p.lon])}
          pathOptions={{
            color: colors[idx % colors.length],
            fillColor: colors[idx % colors.length],
            fillOpacity: 0.15,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="center" className="polygon-label">
            <div className="text-xs font-semibold">
              {region.name}<br />
              threshold: {region.threshold}
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
