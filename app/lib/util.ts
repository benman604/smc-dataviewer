
export function bboxToCenterZoom(bbox: number[]) {
  const [minLon, minLat, , maxLon, maxLat] = bbox;

  const center = {
    lon: (minLon + maxLon) / 2,
    lat: (minLat + maxLat) / 2,
  };

  const lonSpan = Math.abs(maxLon - minLon);
  const latSpan = Math.abs(maxLat - minLat);
  const span = Math.max(lonSpan, latSpan);

  const zoom = Math.log2(360 / span);

  return {
    center,
    zoom: Math.min(Math.max(Math.round(zoom), 1), 10),
  };
}

export function timeToIconColor(timeStr: string): string {
    const now = new Date();
    const time = parseImplicitUTCToLocal(timeStr);

    if (isNaN(time.getTime())) {
        // Invalid date fallback
        return "#cccccc"; // neutral gray
    }

    const diffMs = now.getTime() - time.getTime();
    const diffSec = diffMs / 1000;
    const diffDay = diffSec / (60 * 60 * 24);

    // Colors selected to have similar brightness to #c6d2ff (past month)
    // You can tweak them as needed
    const colors = {
        day: "#ffb19c",   // pastel orange/pink
        week: "#fff585",  // pastel yellow
        month: "#c6d2ff", // pastel blue
        year: "#87ff87",  // pastel green
        other: "#cccccc"  // neutral gray
    };

    if (diffDay <= 1) return colors.day;       // within past day
    if (diffDay <= 7) return colors.week;      // within past week
    if (diffDay <= 30) return colors.month;    // within past month
    if (diffDay <= 365) return colors.year;    // older than a month up to a year
    return colors.other;                       // older than a year
}

export function magToIconDiameter(mag: number): number {
  return mag < 3 ? 15 :
         mag < 4 ? 25 :
         mag < 5 ? 40 :
         mag < 6 ? 50 :
         70;
}

import { FaultType } from './definitions';
export function faultIdToName(faultId: FaultType): string {
    switch (faultId) {
        case 'NM':
            return 'Normal';
        case 'RV':
            return 'Reverse';
        case 'SS':
            return 'Strike-Slip';
        default:
            return faultId;
    }
}

// Shakemap polygon types and constants
export type LatLonPoint = { lat: number; lon: number };
export type PolygonRegion = {
  name: string;
  threshold: number;
  polygon: LatLonPoint[];
};

export const SHAKEMAP_DEFAULT_THRESHOLD = 3.5;
export const SHAKEMAP_THRESHOLD_EXCEPTIONS: PolygonRegion[] = [
  {
    name: 'mendocino_offshore',
    threshold: 4.0,
    polygon: [
      { lat: 40.00, lon: -124.80 },
      { lat: 40.00, lon: -127.00 },
      { lat: 42.00, lon: -127.00 },
      { lat: 42.00, lon: -124.80 },
      { lat: 40.00, lon: -124.80 }
    ]
  },
  {
    name: 'box_deepbaja',
    threshold: 3.8,
    polygon: [
      { lat: 31.50, lon: -114.00 },
      { lat: 31.50, lon: -118.50 },
      { lat: 32.40, lon: -119.29 },
      { lat: 32.40, lon: -114.00 }
    ]
  },
  {
    name: 'box_lametro',
    threshold: 3.0,
    polygon: [
      { lat: 33.50, lon: -116.90 },
      { lat: 33.50, lon: -118.25 },
      { lat: 34.33, lon: -120.00 },
      { lat: 34.50, lon: -120.00 },
      { lat: 34.50, lon: -116.90 }
    ]
  },
  {
    name: 'box_sdmetro',
    threshold: 3.0,
    polygon: [
      { lat: 32.40, lon: -116.75 },
      { lat: 32.40, lon: -117.40 },
      { lat: 33.00, lon: -117.40 },
      { lat: 33.00, lon: -116.75 }
    ]
  }
];

/**
 * Point-in-polygon algorithm using ray casting method
 */
export function pointInPolygon(point: LatLonPoint, polygon: LatLonPoint[]): boolean {
  let numCrosses = 0;
  const count = polygon.length;
  
  for (let i = 0; i < count; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % count];
    
    if (a.lat === b.lat) {
      continue;
    }
    
    if ((point.lat < a.lat) !== (point.lat < b.lat) &&
        (point.lon < b.lon + ((point.lat - a.lat) / (b.lat - a.lat)) * (b.lon - a.lon))) {
      numCrosses++;
    }
  }
  
  return numCrosses % 2 !== 0;
}

/**
 * Get the region info for a given lat/lon point, if it's in a special threshold region
 */
export function getShakemapRegion(lat: number, lon: number): PolygonRegion | null {
  const point = { lat, lon };
  
  for (const exception of SHAKEMAP_THRESHOLD_EXCEPTIONS) {
    if (pointInPolygon(point, exception.polygon)) {
      return exception;
    }
  }
  
  return null;
}

/**
 * Check if event has shakemap based on magnitude threshold for its region.
 * Returns true if magnitude meets or exceeds the threshold for the region the event is in.
 */
function hasShakemap(lat: number, lon: number, magnitude: number): boolean {
  const point = { lat, lon };
  
  // Check if point is in any special threshold region
  for (const exception of SHAKEMAP_THRESHOLD_EXCEPTIONS) {
    if (pointInPolygon(point, exception.polygon)) {
      return magnitude >= exception.threshold;
    }
  }
  
  // Use default threshold if not in any special region
  return magnitude >= SHAKEMAP_DEFAULT_THRESHOLD;
}

// Converts to ISO-8601 UTC
export function parseImplicitUTCToLocal(time: string): Date {
  // "2011-03-11 05:46:23" → "2011-03-11T05:46:23Z"
  return new Date(time.replace(" ", "T") + "Z");
}

import { EventFilters } from '../components/FilterEvents';
import { Event } from './definitions';

export function SMCDataURL(filters: EventFilters): string {
  // if (filters) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startdate", filters.startDate);
    if (filters.endDate) params.append("enddate", filters.endDate);
    if (filters.evName) params.append("evname", filters.evName);
    if (filters.faultTypes && filters.faultTypes.length > 0) {
      params.append("faulttype", filters.faultTypes.join(","));
    }
    if (filters.magMin !== null && filters.magMin !== undefined) params.append("minmag", filters.magMin.toString());
    if (filters.magMax !== null && filters.magMax !== undefined) params.append("maxmag", filters.magMax.toString());
    params.append("orderby", "time");
    params.append("format", "json");
    params.append("nodata", "404");

    return `https://www.strongmotioncenter.org/wserv/events/query?${params.toString()}`;
  // } else {
    // const startDate = getStartDate().toISOString().slice(0, 10); // YYYY-MM-DD
    // return `https://www.strongmotioncenter.org/wserv/events/query?startdate=${startDate}&orderby=time&format=json&nodata=404`;
  // }
}

export function CISNShakemapURL(event: Event): string {
  const id = event.id.slice(2); // remove us/ci/ce prefix
  const lat = event.geometry.coordinates[1];
  const lon = event.geometry.coordinates[0];
  const mag = event.properties.mag ?? 0;
  const state = event.properties.state;
  
  // If in California and meets regional threshold, use CISN shakemap
  if (state === "CA" && hasShakemap(lat, lon, mag)) {
    return `https://www.cisn.org/shakemap/cgs_new/viewLeaflet.html?eventid=${id}`;
  } 
  // Otherwise if magnitude >= 3.5, use USGS shakemap
  else if (mag >= 3.5) {
    return `https://earthquake.usgs.gov/earthquakes/eventpage/${event.id}/shakemap`;
  }
  
  // Return empty string if no shakemap available
  return "";
}