
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

export function timeToColor(timeStr: string): string {
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
