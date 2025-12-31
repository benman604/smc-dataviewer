"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
const Map = dynamic(() => import('./components/Map'), { ssr: false });
const EventMarker = dynamic(() => import('./components/EventMarker'), { ssr: false });
const ShakemapPolygons = dynamic(() => import('./components/ShakemapPolygons'), { ssr: false });
import type { MapView } from "./components/Map";
import FilterEvents from "./components/FilterEvents";
import EventLegend from "./components/EventLegend";
import { EventFilters } from "./components/FilterEvents";
import { Event } from "./lib/definitions";
import { bboxToCenterZoom, timeToIconColor, faultIdToName, parseImplicitUTCToLocal, SMCDataURL, CISNShakemapURL, SHAKEMAP_THRESHOLD_EXCEPTIONS, getShakemapRegion, SHAKEMAP_DEFAULT_THRESHOLD } from "./lib/util";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faArrowDownWideShort, faArrowUpWideShort, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

type Recency = "Day" | "Week" | "Month" | "Year" | null;
type OrderBy = {
  field: "time" | "magnitude";
  direction: "asc" | "desc";
}

export default function Home() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialLoadRef = useRef(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [updateMapView, setUpdateMapView] = useState<boolean>(false);
  const [view, setView] = useState<MapView>({
    center: [37.7749, -120.4194],
    zoom: 6,
  });
  const [recency, setRecency] = useState<Recency>("Week");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>({ field: "time", direction: "desc" });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [listVisibleOnly, setListVisibleOnly] = useState<boolean>(false);
  const [showPolygons, setShowPolygons] = useState<boolean>(false);

  function getStartDate(): Date {
    const date = new Date(Date.now());
    switch (recency) {
      case "Day":
        date.setDate(date.getDate() - 1);
        break;
      case "Week":
        date.setDate(date.getDate() - 7);
        break;
      case "Month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "Year":
        date.setFullYear(date.getFullYear() - 1);
        break;
    }

    return date;
  }

  const [startDate, setStartDate] = useState<Date>(getStartDate());

  const defaultFilters: EventFilters = {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: "",
    // empty array represents Any (no specific fault-type filter)
    faultTypes: [],
    evName: "",
    magMin: null,
    magMax: null,
  }

  const [filters, setFilters] = useState<EventFilters>(defaultFilters);

  function clearFilters() {
    setFilters({
      ...defaultFilters,
      faultTypes: [...defaultFilters.faultTypes] // Create a new array for `faultTypes`
    });
  }

  // Helper to update URL without reload
  const updateURL = useCallback((filtersToSync: EventFilters) => {
    const params = new URLSearchParams();
    if (filtersToSync.startDate) params.set('startDate', filtersToSync.startDate);
    if (filtersToSync.endDate) params.set('endDate', filtersToSync.endDate);
    if (filtersToSync.faultTypes && filtersToSync.faultTypes.length > 0) {
      params.set('faultTypes', filtersToSync.faultTypes.join(','));
    }
    if (filtersToSync.evName) params.set('evName', filtersToSync.evName);
    if (filtersToSync.magMin != null) params.set('magMin', String(filtersToSync.magMin));
    if (filtersToSync.magMax != null) params.set('magMax', String(filtersToSync.magMax));
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Helper to read filters from URL
  const getFiltersFromURL = useCallback((): EventFilters | null => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const faultTypesStr = searchParams.get('faultTypes');
    const evName = searchParams.get('evName');
    const magMinStr = searchParams.get('magMin');
    const magMaxStr = searchParams.get('magMax');
    
    // If no URL params, return null to use defaults
    if (!startDate && !endDate && !faultTypesStr && !evName && !magMinStr && !magMaxStr) {
      return null;
    }
    
    return {
      startDate: startDate || '',
      endDate: endDate || '',
      faultTypes: faultTypesStr ? faultTypesStr.split(',').filter(t => ['NM', 'RS', 'SS'].includes(t)) as any : [],
      evName: evName || '',
      magMin: magMinStr ? Number(magMinStr) : null,
      magMax: magMaxStr ? Number(magMaxStr) : null,
    };
  }, [searchParams]);

  async function fetchEvents(withFilters: boolean = false) {
    setLoading(true);
    setError(null);
    try {
      // console.log(SMCDataURL(withFilters));
      const _filters: EventFilters = withFilters
        ? filters
        : {
            ...defaultFilters,
            startDate: getStartDate().toISOString().slice(0, 10),
          };
      
      // Only update URL when user explicitly applies filters
      if (withFilters) {
        updateURL(_filters);
      }
      
      const response = await fetch(SMCDataURL(_filters));
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      console.log(data);
      setEvents(data.features || []);
      if (data.bbox) {
        const { center, zoom } = bboxToCenterZoom(data.bbox);
        setView({ center: [center.lat, center.lon], zoom });
        setUpdateMapView((v) => !v);
      } else {
        // Fallback: calculate center from events
        const lats = data.features.map((ev: Event) => ev.geometry.coordinates[1]);
        const lons = data.features.map((ev: Event) => ev.geometry.coordinates[0]);
        if (lats.length > 0 && lons.length > 0) {
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          const { center, zoom } = bboxToCenterZoom([minLon, minLat, 0, maxLon, maxLat, 0]);
          setView({ center: [center.lat, center.lon], zoom: zoom });
          setUpdateMapView((v) => !v);
        }
      }
    } catch (err: any) {
      console.error(err);
      setEvents([]);
      closeSelectedEvent(true);
      setError(err?.message ?? "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  const visibleEvents = useMemo(() => {
    const filtered = events.filter((a: Event) => {
      if (listVisibleOnly) {
        // If the Map has provided bounds, filter events to those inside the current view
        const bounds = (view as any).bounds;
        if (bounds) {
          const lat = a.geometry.coordinates[1];
          const lon = a.geometry.coordinates[0];
          const { north, south, east, west } = bounds;
          if (lat < south || lat > north) return false;
          if (lon < west || lon > east) return false;
        }
      }
      return true;
    });

    return filtered.sort((a: Event, b: Event) => {
        if (orderBy.field === "time") {
          const timeA = new Date(a.properties.time).getTime();
          const timeB = new Date(b.properties.time).getTime();
          return orderBy.direction === "asc" ? timeA - timeB : timeB - timeA;
        } else if (orderBy.field === "magnitude") {
          const magA = a.properties.mag ?? -Infinity;
          const magB = b.properties.mag ?? -Infinity;
          return orderBy.direction === "asc" ? magA - magB : magB - magA;
        }
        return 0;
      });
  }, [events, orderBy, view, listVisibleOnly]);

  // Helper to apply URL filters
  const applyUrlFilters = useCallback(() => {
    const urlFilters = getFiltersFromURL();
    
    if (urlFilters) {
      // URL has filters - apply them
      setRecency(null); // Disable recency presets when using URL filters
      setFilters(urlFilters);
      // Fetch with URL filters
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(SMCDataURL(urlFilters));
          if (!response.ok) throw new Error(`Server returned ${response.status}`);
          const data = await response.json();
          setEvents(data.features || []);
          if (data.bbox) {
            const { center, zoom } = bboxToCenterZoom(data.bbox);
            setView({ center: [center.lat, center.lon], zoom });
            setUpdateMapView((v) => !v);
          }
        } catch (err: any) {
          console.error(err);
          setEvents([]);
          setError(err?.message ?? "Failed to fetch events");
        } finally {
          setLoading(false);
        }
      })();
      return true;
    }
    return false;
  }, [getFiltersFromURL]);

  // Watch for URL param changes (including when navigating back via Link)
  // Use searchParams.toString() as dependency to ensure it triggers on client navigation
  const searchParamsString = searchParams.toString();
  
  useEffect(() => {
    if (!applyUrlFilters() && initialLoadRef.current) {
      // No URL filters and first load - use default behavior
      initialLoadRef.current = false;
      fetchEvents();
    }
  }, [searchParamsString]);

  // Listen for popstate (browser back/forward) to handle URL changes
  useEffect(() => {
    const handlePopState = () => {
      // Re-read URL and apply filters
      const params = new URLSearchParams(window.location.search);
      const startDate = params.get('startDate');
      const endDate = params.get('endDate');
      const faultTypesStr = params.get('faultTypes');
      const evName = params.get('evName');
      const magMinStr = params.get('magMin');
      const magMaxStr = params.get('magMax');
      
      if (startDate || endDate || faultTypesStr || evName || magMinStr || magMaxStr) {
        const urlFilters: EventFilters = {
          startDate: startDate || '',
          endDate: endDate || '',
          faultTypes: faultTypesStr ? faultTypesStr.split(',').filter(t => ['NM', 'RS', 'SS'].includes(t)) as any : [],
          evName: evName || '',
          magMin: magMinStr ? Number(magMinStr) : null,
          magMax: magMaxStr ? Number(magMaxStr) : null,
        };
        setRecency(null);
        setFilters(urlFilters);
        // Fetch
        (async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(SMCDataURL(urlFilters));
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const data = await response.json();
            setEvents(data.features || []);
            if (data.bbox) {
              const { center, zoom } = bboxToCenterZoom(data.bbox);
              setView({ center: [center.lat, center.lon], zoom });
              setUpdateMapView((v) => !v);
            }
          } catch (err: any) {
            console.error(err);
            setEvents([]);
            setError(err?.message ?? "Failed to fetch events");
          } finally {
            setLoading(false);
          }
        })();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handler for recency button clicks - directly fetches instead of relying on effects
  function handleRecencyClick(r: Recency) {
    if (r == null) return;
    
    setRecency(r);
    
    // Compute the start date for this recency
    const date = new Date(Date.now());
    switch (r) {
      case "Day":
        date.setDate(date.getDate() - 1);
        break;
      case "Week":
        date.setDate(date.getDate() - 7);
        break;
      case "Month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "Year":
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    
    const computedStart = date;
    setEvents([]);
    closeSelectedEvent();
    setStartDate(computedStart);
    
    const newFilters = {
      startDate: computedStart.toISOString().slice(0, 10),
      endDate: "",
      faultTypes: [] as any,
      evName: "",
      magMin: null,
      magMax: null,
    };
    setFilters(newFilters);
    
    // Clear URL params when using recency buttons
    window.history.replaceState({}, '', window.location.pathname);
    
    // Fetch immediately with computed filters
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(SMCDataURL(newFilters));
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        setEvents(data.features || []);
        if (data.bbox) {
          const { center, zoom } = bboxToCenterZoom(data.bbox);
          setView({ center: [center.lat, center.lon], zoom });
          setUpdateMapView((v) => !v);
        }
      } catch (err: any) {
        console.error(err);
        setEvents([]);
        setError(err?.message ?? "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    })();
  }

  // keep panelOpen in sync with selectedEvent
  useEffect(() => {
    if (selectedEvent) setPanelOpen(true);
  }, [selectedEvent]);

  function closeSelectedEvent(immediate=false) {
    if (immediate) {
      setPanelOpen(false);
      setSelectedEvent(null);
      return;
    }
    setPanelOpen(false);
    // wait for exit animation then clear selectedEvent
    setTimeout(() => setSelectedEvent(null), 100);
  }

  useEffect(() => {
    if (selectedEvent === null) return;
    
    // Debug log for shakemap region
    const lat = selectedEvent.geometry.coordinates[1];
    const lon = selectedEvent.geometry.coordinates[0];
    const mag = selectedEvent.properties.mag ?? 0;
    const region = getShakemapRegion(lat, lon);
    
    if (region) {
      console.log(`📍 Event in polygon: ${region.name}, threshold: ${region.threshold}, magnitude: ${mag}`);
    } else {
      console.log(`📍 Event NOT in any polygon, using default threshold: ${SHAKEMAP_DEFAULT_THRESHOLD}, magnitude: ${mag}`);
    }
    
    setView({
      center: [selectedEvent.geometry.coordinates[1], selectedEvent.geometry.coordinates[0]],
      zoom: view.zoom
    });
    setUpdateMapView(!updateMapView);
  }, [selectedEvent]);

  // When an event is selected, scroll its listing into view and let the CSS highlight it
  useEffect(() => {
    if (!selectedEvent) return;
    const el = document.getElementById(`list-event-${selectedEvent.id}`);
    if (el) {
      // smooth scroll and center the item in the visible area
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedEvent, listVisibleOnly, visibleEvents]);

  return (
    <div className="flex flex-1 min-h-0 bg-stone-100 border-r-4 border-stone-300">
        <aside className="w-80 flex flex-col border-r border-stone-300">
          <div className="px-4 pt-4 pb-2 border-b border-b-stone-300">
            <h2 className="font-large merriweather font-bold">Internet Quick Report</h2>
            {/* Loading / Error / Count */}
            <div className="mt-1">
              {loading ? (
                <div className="flex items-center text-xs text-stone-600">
                  <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2" />
                  Loading events...
                </div>
              ) : error ? (
                <div className="text-xs text-red-800 flex items-center gap-2">
                  <span>No events found! {error}</span>
                  <button
                    className="text-xs text-blue-600 underline ml-2"
                    onClick={() => fetchEvents()}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p className="text-xs">Showing {visibleEvents.length} of {events.length} earthquake{events.length !== 1 ? 's' : ''}{recency ? ` from the past ${recency.toLowerCase()}` : ''}</p>
              )}
            </div>

            {!filterOpen && (
              <div className="mt-3 grid grid-cols-4 gap-1">
                {(["Day", "Week", "Month", "Year"] as Recency[]).map((r) => (
                  <button
                    key={r}
                    className={`rounded w-full py-2 text-sm hover:cursor-pointer ${recency === r ? 'bg-purple-600 text-white' : 'bg-stone-200 hover:bg-stone-300'}`}
                    onClick={() => handleRecencyClick(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filterOpen ? 'max-h-96 translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'}`}>
              <FilterEvents filters={filters} onChange={setFilters} onApply={() => {
                fetchEvents(true);
                setRecency(null);
                closeSelectedEvent();
              }} />
            </div>

            <div className="mt-2 flex items-center text-s">
              {/* Left: Filter link */}
              <div className="flex-1">
                <button className="text-blue-600 hover:text-blue-700 hover:cursor-pointer text-sm" onClick={() => setFilterOpen(!filterOpen)}>
                  <FontAwesomeIcon icon={filterOpen ? faCircleXmark : faSearch} /> {filterOpen ? 'Close' : 'Search'}
                </button>
              </div>

              {/* Right: Order by */}
              <div className="flex-2 flex justify-end items-center gap-1 text-stone-600">
                <span className="text-sm">Order by</span>

                {/* Dropdown */}
                <select
                  className="hover:cursor-pointer text-xs px-1 py-0.5 border border-stone-300 rounded bg-white focus:outline-none"
                  defaultValue="time"
                  onChange={(e) => setOrderBy({ ...orderBy, field: e.target.value as "time" | "magnitude" })}
                >
                  <option value="time">time</option>
                  <option value="magnitude">magnitude</option>
                </select>

                {/* Sort arrow circle */}
                <div className="hover:cursor-pointer hover:bg-stone-200 h-6 w-6 flex items-center justify-center rounded-full border border-stone-300 bg-white text-[10px] text-stone-600 select-none">
                  <FontAwesomeIcon 
                    icon={orderBy.direction === "asc" ? faArrowUpWideShort : faArrowDownWideShort} 
                    onClick={() => setOrderBy({ ...orderBy, direction: orderBy.direction === "asc" ? "desc" : "asc" })}
                  />
                </div>
              </div>
            </div>

            <label className="mt-1 flex gap-1 text-sm">
              <input type="checkbox" checked={listVisibleOnly} onChange={() => setListVisibleOnly(!listVisibleOnly)} />
              Only list earthquakes visible in map
            </label>

            {/* <label className="mt-1 flex gap-1 text-sm">
              <input type="checkbox" checked={showPolygons} onChange={() => setShowPolygons(!showPolygons)} />
              Show shakemap threshold regions
            </label> */}
          </div>

          <div className="flex-1 overflow-auto p-0 m-0" role="list">
            {visibleEvents.map((event: Event, i) => (
              <div key={event.id ?? i} id={`list-event-${event.id}`} className="w-full" role="listitem">
                <div 
                  className={`px-4 py-2 border-b border-stone-300 ${selectedEvent?.id === event.id ? 'bg-purple-200 border-t-5 border-t-purple-400' : 'bg-stone-50 hover:bg-stone-100 cursor-pointer'}`}
                  onClick={() => setSelectedEvent(event)}
                >

                  <div className="flex gap-3 items-start">
                    {/* Left column */}
                    <div className="shrink-0">
                      <div 
                        className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border border-stone-500"
                        style={{ backgroundColor: timeToIconColor(event.properties.time) }}
                      >
                        {event.properties.mag?.toFixed(1) ?? "-"}
                      </div>
                    </div>

                    {/* Right content */}
                    <div className="flex-1">
                      <p className="leading-tight">{event.properties.title}</p>
                      <p className="text-xs text-stone-500">
                        {event.properties.place}, {parseImplicitUTCToLocal(event.properties.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-h-0">
          <section className="h-full min-h-0 relative">
            <Map view={view} updateMapView={updateMapView} onViewChange={(newView) => setView(newView)} legend={<EventLegend />}>
              {showPolygons && <ShakemapPolygons />}
              {visibleEvents.toReversed().map((event: Event, i) => (
                <EventMarker key={i} event={event} onSelect={() => setSelectedEvent(event)} isSelected={selectedEvent === event} />
              ))}
            </Map>
            
            {/* Floating panel (animated) */}
            <div className={`absolute top-4 right-4 w-80 p-4 bg-white border border-stone-300 transform transition-all duration-300 ease-in-out ${panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`} style={{ zIndex: 100000 }} aria-hidden={!panelOpen}>
              {/* close button (positioned top-right) */}
              <button
                className="flex items-center justify-center pt-0 mt-0 mb-2 text-blue-500 hover:text-blue-700 hover:cursor-pointer"
                onClick={() => closeSelectedEvent()}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faCircleXmark} />
                <span className="ml-1">Close</span>
              </button>
              {selectedEvent && (
                <>
                  <h2 className="font-bold">{selectedEvent.properties.magType} {selectedEvent.properties.mag} {selectedEvent.properties.title}</h2>
                  <p>{new Date(selectedEvent.properties.time).toLocaleString()} UTC</p>
                  <p className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      <span className="font-medium text-stone-700">Lat</span>
                      {selectedEvent.geometry.coordinates[1]}
                      <span className="font-medium text-stone-700">Lon</span>
                      {selectedEvent.geometry.coordinates[0]}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      <span className="font-medium text-stone-700">Depth</span>
                      {selectedEvent.geometry.coordinates[2]} km
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      {selectedEvent.properties.RecordNum}
                      <span className="font-medium text-stone-700">Records</span>
                    </span>

                    {selectedEvent.properties.faultType &&
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                        {faultIdToName(selectedEvent.properties.faultType)}
                        <span className="font-medium text-stone-700">Fault</span>
                      </span>
                    }

                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      {selectedEvent.id}
                    </span>
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">

                    {selectedEvent.properties.RecordNum > 0 && (
                      <Link
                        href={`/records?evid=${selectedEvent.id}${window.location.search ? '&from=' + encodeURIComponent(window.location.search) : ''}`}
                        className="flex flex-col items-center py-1 px-2 opacity-70 hover:opacity-100 bg-white cursor-pointer"
                        title="Interactive Map"
                      >
                        <span className="text-sm font-medium">Interactive Map</span>
                        <img src="/iqr_map_icon.jpg" alt="Interactive map icon" className="w-12 h-12 object-cover rounded" />
                      </Link>
                    )}

                    {CISNShakemapURL(selectedEvent) && (
                      <a
                        className="flex flex-col items-center py-1 px-2 opacity-70 hover:opacity-100 bg-white cursor-pointer"
                        title="ShakeMap"
                        href={CISNShakemapURL(selectedEvent)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-sm font-medium">ShakeMap</span>
                        <img src="/shakemap_icon.jpg" alt="ShakeMap icon" className="w-12 h-12 object-cover rounded" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
  );
}
