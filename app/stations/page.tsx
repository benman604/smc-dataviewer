"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
const Map = dynamic(() => import('../components/Map'), { ssr: false });
const StationMarker = dynamic(() => import('../components/StationMarker'), { ssr: false });
import type { MapView } from "../components/Map";
import FilterStations, { StationFilters, DEFAULT_NETWORKS } from "../components/FilterStations";
import StationLegend from "../components/StationLegend";
import { StationFeature, StationsResponse, BaseStation, NETWORK_COLORS } from "../lib/definitions";
import { SMCStationsURL, bboxToCenterZoom } from "../lib/util";
import { useState, useEffect, useMemo, Suspense } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faArrowDownWideShort, faArrowUpWideShort, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

type OrderBy = {
  field: "name" | "code" | "network" | "type" | "vs30";
  direction: "asc" | "desc";
}

// Convert GeoJSON feature to BaseStation format
function featureToStation(feature: StationFeature): BaseStation {
  return {
    code: feature.properties.code,
    network: feature.properties.network,
    status: feature.properties.status,
    channels: feature.properties.channels,
    recorder_type: feature.properties.recorder_type,
    numRecorders: feature.properties.numRecorders,
    name: feature.properties.name,
    location: feature.properties.location,
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
    elevation: feature.properties.elevation,
    type: feature.properties.type,
    Vs30: feature.properties.Vs30,
    siteclass: feature.properties.siteclass,
  };
}

// Extended station info from the stations endpoint
type StationInfo = BaseStation & {
  comm_code: string | null;
  crl_orientation: string | null;
  effdate: string | null;
  geology: string | null;
  Vs30_info: string | null;
  Vs30_Method: string | null;
  Vs30_reference: string | null;
  bldtype: string | null;
  bldheight: string | null;
  stationpage: string | null;
};

function featureToStationInfo(feature: StationFeature): StationInfo {
  return {
    ...featureToStation(feature),
    comm_code: feature.properties.comm_code,
    crl_orientation: feature.properties.crl_orientation,
    effdate: feature.properties.effdate,
    geology: feature.properties.geology,
    Vs30_info: feature.properties.Vs30_info,
    Vs30_Method: feature.properties.Vs30_Method,
    Vs30_reference: feature.properties.Vs30_reference,
    bldtype: feature.properties.bldtype,
    bldheight: feature.properties.bldheight,
    stationpage: feature.properties.stationpage,
  };
}

// Maximum visible stations before requiring zoom
const MAX_VISIBLE_STATIONS = 1000;

// Calculate approximate bounds from center and zoom
// This is an approximation assuming a standard viewport size
function calculateBounds(center: [number, number], zoom: number) {
  // Approximate degrees per pixel at equator, adjusted for zoom
  const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));
  // Approximate viewport size in pixels (assuming ~800x600 visible area)
  const latSpan = degreesPerPixel * 600 / 2;
  const lonSpan = degreesPerPixel * 800 / 2;
  // Adjust for latitude (longitude degrees shrink toward poles)
  const lonSpanAdjusted = lonSpan / Math.cos(center[0] * Math.PI / 180);
  
  return {
    north: center[0] + latSpan,
    south: center[0] - latSpan,
    east: center[1] + lonSpanAdjusted,
    west: center[1] - lonSpanAdjusted,
  };
}

function StationsContent() {
  const [stations, setStations] = useState<StationInfo[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [updateMapView, setUpdateMapView] = useState<boolean>(false);
  const [view, setView] = useState<MapView>({
    center: [37.8716, -122.2727], // Bay Area (Berkeley)
    zoom: 10,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>({ field: "name", direction: "asc" });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const defaultFilters: StationFilters = {
    stationName: "",
    stationTypes: 'any',
    networks: 'default',
    abandoned: false,
    stcode: "",
    siteClass: "",
    vs30Min: null,
    vs30Max: null,
  }

  const [filters, setFilters] = useState<StationFilters>(defaultFilters);

  function clearFilters() {
    setFilters({ ...defaultFilters });
  }

  async function fetchStations(autoZoom: boolean = false) {
    setLoading(true);
    setError(null);
    try {
      const url = SMCStationsURL(filters);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data: StationsResponse = await response.json();
      console.log(data);
      
      const stationList = data.features?.map(featureToStationInfo) || [];
      setStations(stationList);
      setTotalCount(data.metadata?.count?.total || stationList.length);

      // Auto-zoom to fit stations only when explicitly requested (e.g., after applying filters)
      if (stationList.length > 0 && autoZoom) {
        const lats = stationList.map(s => s.latitude);
        const lons = stationList.map(s => s.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const { center, zoom } = bboxToCenterZoom([minLon, minLat, 0, maxLon, maxLat, 0]);
        setView({ center: [center.lat, center.lon], zoom });
        setUpdateMapView((v) => !v);
      }
    } catch (err: any) {
      console.error(err);
      setStations([]);
      closeSelectedStation(true);
      setError(err?.message ?? "Failed to fetch stations");
    } finally {
      setLoading(false);
    }
  }

  // Apply local filters (site class, vs30)
  const visibleStations = useMemo(() => {
    let filtered = stations.filter((station: StationInfo) => {
      // Site class filter
      if (filters.siteClass && station.siteclass !== filters.siteClass) {
        return false;
      }

      // Vs30 filters
      if (filters.vs30Min !== null && (station.Vs30 === null || station.Vs30 < filters.vs30Min)) {
        return false;
      }
      if (filters.vs30Max !== null && (station.Vs30 === null || station.Vs30 > filters.vs30Max)) {
        return false;
      }

      // Always filter to visible bounds
      const bounds = (view as any).bounds;
      if (bounds) {
        const lat = station.latitude;
        const lon = station.longitude;
        const { north, south, east, west } = bounds;
        if (lat < south || lat > north) return false;
        if (lon < west || lon > east) return false;
      }

      return true;
    });

    return filtered.sort((a: StationInfo, b: StationInfo) => {
      let valA: string | number;
      let valB: string | number;
      
      switch (orderBy.field) {
        case "name":
          valA = (a.name ?? '').toLowerCase();
          valB = (b.name ?? '').toLowerCase();
          break;
        case "code":
          valA = (a.code ?? '').toLowerCase();
          valB = (b.code ?? '').toLowerCase();
          break;
        case "network":
          valA = (a.network ?? '').toLowerCase();
          valB = (b.network ?? '').toLowerCase();
          break;
        case "type":
          valA = (a.type ?? '').toLowerCase();
          valB = (b.type ?? '').toLowerCase();
          break;
        case "vs30":
          valA = a.Vs30 ?? 0;
          valB = b.Vs30 ?? 0;
          break;
        default:
          return 0;
      }
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return orderBy.direction === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return orderBy.direction === "asc" 
        ? (valA as number) - (valB as number) 
        : (valB as number) - (valA as number);
    });
  }, [stations, orderBy, view, filters.siteClass, filters.vs30Min, filters.vs30Max, selectedStation]);

  useEffect(() => {
    fetchStations();
  }, []);

  // keep panelOpen in sync with selectedStation
  useEffect(() => {
    if (selectedStation) setPanelOpen(true);
  }, [selectedStation]);

  function closeSelectedStation(immediate = false) {
    if (immediate) {
      setPanelOpen(false);
      setSelectedStation(null);
      return;
    }
    setPanelOpen(false);
    setTimeout(() => setSelectedStation(null), 100);
  }

  useEffect(() => {
    if (selectedStation === null) return;
    // Only change zoom if markers are currently hidden (too many visible stations)
    const needsZoom = visibleStations.length > MAX_VISIBLE_STATIONS;
    const newCenter: [number, number] = [selectedStation.latitude, selectedStation.longitude];
    const newZoom = needsZoom ? 12 : view.zoom;
    // Calculate new bounds so visibleStations updates immediately
    const newBounds = calculateBounds(newCenter, newZoom);
    
    setView({
      center: newCenter,
      zoom: newZoom,
    });
    setUpdateMapView(!updateMapView);
  }, [selectedStation]);

  // Scroll selected station into view
  useEffect(() => {
    if (!selectedStation) return;
    const el = document.getElementById(`list-station-${selectedStation.code}`);
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, [selectedStation, visibleStations]);

  // Get station fill color based on network (gray for abandoned)
  const getStationColor = (station: BaseStation) => {
    if (station.status !== 'Active') return '#cccccc';
    return NETWORK_COLORS[station.network] || '#d6932d';
  };

  return (
    <div className="flex flex-1 min-h-0 bg-stone-100 border-r-4 border-stone-300">
      <aside className="w-80 flex flex-col border-r border-stone-300">
        <div className="px-4 pt-4 pb-2 border-b border-b-stone-300">
          <h1 className="text-xl font-bold merriweather">Station Network</h1>

          {/* Loading / Error / Count */}
          <div className="mt-2">
            {loading ? (
              <div className="flex items-center text-xs text-stone-600">
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2" />
                Loading stations...
              </div>
            ) : error ? (
              <div className="text-xs text-red-800 flex items-center gap-2">
                <span>Error: {error}</span>
                <button
                  className="text-xs text-blue-600 underline ml-2"
                  onClick={() => fetchStations()}
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-xs">
                Showing {visibleStations.length} of {totalCount} station{totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filterOpen ? 'max-h-[600px] translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'}`}>
            <FilterStations 
              filters={filters} 
              onChange={setFilters} 
              onSubmit={() => fetchStations(true)}
            />
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

              <select
                className="hover:cursor-pointer text-xs px-1 py-0.5 border border-stone-300 rounded bg-white focus:outline-none"
                value={orderBy.field}
                onChange={(e) => setOrderBy({ ...orderBy, field: e.target.value as OrderBy["field"] })}
              >
                <option value="name">Name</option>
                <option value="code">Code</option>
                <option value="network">Network</option>
                <option value="type">Type</option>
                <option value="vs30">Vs30</option>
              </select>

              <div className="hover:cursor-pointer hover:bg-stone-200 h-6 w-6 flex items-center justify-center rounded-full border border-stone-300 bg-white text-[10px] text-stone-600 select-none">
                <FontAwesomeIcon 
                  icon={orderBy.direction === "asc" ? faArrowUpWideShort : faArrowDownWideShort} 
                  onClick={() => setOrderBy({ ...orderBy, direction: orderBy.direction === "asc" ? "desc" : "asc" })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-0 m-0" role="list">
          {visibleStations.map((station: StationInfo, i: number) => {
            return (
              <div key={`${station.network}-${station.code}-${i}`} id={`list-station-${station.code}`} className="w-full" role="listitem">
                <div 
                  className={`px-4 py-2 border-b border-stone-300 ${selectedStation?.code === station.code && selectedStation?.network === station.network ? 'bg-purple-200 border-t-5 border-t-purple-400' : 'bg-stone-50 hover:bg-stone-100 cursor-pointer'}`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex gap-3 items-start">
                    {/* Left column - Code indicator */}
                    <div className="shrink-0">
                      <div 
                        className="w-10 h-7 text-xs font-bold flex items-center justify-center border border-stone-500"
                        style={{ backgroundColor: getStationColor(station) }}
                      >
                        {station.network}
                      </div>
                    </div>

                    {/* Right content */}
                    <div className="flex-1 min-w-0">
                      <p className="leading-tight text-sm truncate">{station.name}</p>
                      <p className="text-xs text-stone-500">
                        {station.code} · {station.type} · {station.status}
                        {station.Vs30 && ` · Vs30: ${station.Vs30}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 min-h-0">
        <section className="h-full min-h-0 relative">
          <Map view={view} updateMapView={updateMapView} onViewChange={(newView) => setView(newView)} legend={<StationLegend />} animateView={false}>
            {visibleStations.length <= MAX_VISIBLE_STATIONS ? (
              visibleStations.map((station: StationInfo, i: number) => (
                <StationMarker 
                  key={`${station.network}-${station.code}-${i}`} 
                  station={station} 
                  onSelect={() => setSelectedStation(station)} 
                  isSelected={selectedStation?.code === station.code && selectedStation?.network === station.network}
                  fillColor={getStationColor(station)}
                />
              ))
            ) : null}
          </Map>
          
          {/* Zoom warning overlay */}
          {visibleStations.length > MAX_VISIBLE_STATIONS && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 border border-amber-400 px-4 py-2 text-sm" style={{ zIndex: 100000 }}>
              Zoom in to view station markers
            </div>
          )}
          
          {/* Floating panel (animated) */}
          <div className={`absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto p-4 bg-white border border-stone-300 transform transition-all duration-300 ease-in-out ${panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`} style={{ zIndex: 100000 }} aria-hidden={!panelOpen}>
            <button
              className="flex items-center justify-center pt-0 mt-0 mb-2 text-blue-500 hover:text-blue-700 hover:cursor-pointer"
              onClick={() => closeSelectedStation()}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faCircleXmark} />
              <span className="ml-1">Close</span>
            </button>
            {selectedStation && (
              <>
                <h2 className="font-bold">{selectedStation.code} - {selectedStation.name}</h2>
                
                <p className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      {selectedStation.network}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                        <span className="font-medium text-stone-700">Lat</span>
                        {selectedStation.latitude.toFixed(4)}
                        <span className="font-medium text-stone-700">Lon</span>
                        {selectedStation.longitude.toFixed(4)}
                    </span>

                    {selectedStation.elevation && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                        <span className="font-medium text-stone-700">Elev</span>
                        {selectedStation.elevation} m
                        </span>
                    )}

                    {selectedStation.type && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                            {selectedStation.type}
                        </span>
                    )}

                    {selectedStation.siteclass && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                            Site class {selectedStation.siteclass}
                        </span>
                    )}

                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${selectedStation.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
                        {selectedStation.status}
                    </span>
                </p>

                <div className="mt-3">
                  <h3 className="font-semibold text-sm mb-1">Station Details</h3>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {selectedStation.channels && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Channels:</span> {selectedStation.channels}
                      </div>
                    )}
                    {selectedStation.numRecorders && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Recorders:</span> {selectedStation.numRecorders}
                      </div>
                    )}
                    {selectedStation.Vs30 && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Vs30:</span> {selectedStation.Vs30} m/s
                      </div>
                    )}
                    {selectedStation.Vs30_info && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Vs30 Info:</span> {selectedStation.Vs30_info}
                      </div>
                    )}
                    {selectedStation.geology && (
                      <div className="bg-stone-100 p-1.5 col-span-2">
                        <span className="font-medium">Geology:</span> {selectedStation.geology}
                      </div>
                    )}
                    {selectedStation.effdate && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Effective Date:</span> {selectedStation.effdate}
                      </div>
                    )}
                    {selectedStation.recorder_type && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Recorder Type:</span> {selectedStation.recorder_type}
                      </div>
                    )}
                    {selectedStation.crl_orientation && (
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Orientation:</span> {selectedStation.crl_orientation}°
                      </div>
                    )}
                    {selectedStation.location && (
                      <div className="bg-stone-100 p-1.5 col-span-2">
                        <span className="font-medium">Location:</span> {selectedStation.location}
                      </div>
                    )}
                  </div>

                  {selectedStation.bldtype && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-xs mb-1">Building Info</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">Type:</span> {selectedStation.bldtype}
                        </div>
                        {selectedStation.bldheight && (
                          <div className="bg-stone-100 p-1.5">
                            <span className="font-medium">Height:</span> {selectedStation.bldheight}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedStation.Vs30_reference && (
                    <div className="mt-2 text-xs text-stone-500">
                      <span className="font-medium">Vs30 Reference:</span> {selectedStation.Vs30_reference}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/stations/records?stcode=${selectedStation.network}${selectedStation.code}`}
                      className="flex-1 text-center py-2 bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                    >
                      Records
                    </Link>
                    
                    {selectedStation.stationpage && (
                      <a
                        href={selectedStation.stationpage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300"
                      >
                        Station Page
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function StationsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    }>
      <StationsContent />
    </Suspense>
  );
}
