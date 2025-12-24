
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
    const time = new Date(timeStr);

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
  if (event.properties.state == "CA" && event.properties.country == "US") {
    return `https://www.cisn.org/shakemap/cgs_new/viewLeaflet.html?eventid=${id}`;
  } else{
    return `https://earthquake.usgs.gov/earthquakes/eventpage/${event.id}/shakemap`;
  }
}