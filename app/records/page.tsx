"use client";
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
const Map = dynamic(() => import('../components/Map'), { ssr: false });
const StationMarker = dynamic(() => import('../components/StationMarker'), { ssr: false });
const EpicenterMarker = dynamic(() => import('../components/EpicenterMarker'), { ssr: false });
import type { MapView } from "../components/Map";
import FilterRecords, { RecordFilters } from "../components/FilterRecords";
import RecordLegend from "../components/RecordLegend";
import { Station, RecordsResponse } from "../lib/definitions";
import { SMCRecordsURL, pgaToColor, getMaxPGA, bboxToCenterZoom } from "../lib/util";
import { useState, useEffect, useMemo, Suspense } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter, faArrowDownWideShort, faArrowUpWideShort, faCircleXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type OrderBy = {
  field: "pga" | "pgv" | "sa1" | "epidist";
  direction: "asc" | "desc";
}

function RecordsContent() {
  const searchParams = useSearchParams();
  const evid = searchParams.get('evid');
  const fromParams = searchParams.get('from'); // Original earthquakes page URL params
  const backUrl = fromParams ? `/${fromParams}` : '/';

  const [stations, setStations] = useState<Station[]>([]);
  const [eventInfo, setEventInfo] = useState<Station['events'][0] | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [updateMapView, setUpdateMapView] = useState<boolean>(false);
  const [view, setView] = useState<MapView>({
    center: [37.7749, -120.4194],
    zoom: 7,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>({ field: "pga", direction: "desc" });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [listVisibleOnly, setListVisibleOnly] = useState<boolean>(false);

  const defaultFilters: RecordFilters = {
    stationName: "",
    pgaMin: null,
    pgaMax: null,
    pgvMin: null,
    pgvMax: null,
    sa1Min: null,
    sa1Max: null,
  }

  const [filters, setFilters] = useState<RecordFilters>(defaultFilters);

  function clearFilters() {
    setFilters({ ...defaultFilters });
  }

  async function fetchRecords() {
    if (!evid) {
      setError("No event ID provided");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SMCRecordsURL(evid));
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data: RecordsResponse = await response.json();
      console.log(data);
      
      const stationList = data.results?.stations || [];
      setStations(stationList);
      
      // Get event info from first station
      if (stationList.length > 0 && stationList[0].events.length > 0) {
        setEventInfo(stationList[0].events[0]);
      }

      // Calculate bounds from stations
      if (stationList.length > 0) {
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
      setError(err?.message ?? "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }

  const visibleStations = useMemo(() => {
    let filtered = stations.filter((station: Station) => {
      // Filter by name/code
      if (filters.stationName) {
        const search = filters.stationName.toLowerCase();
        if (!station.name.toLowerCase().includes(search) && 
            !station.code.toLowerCase().includes(search)) {
          return false;
        }
      }

      const record = station.events[0]?.record;
      if (!record) return false;

      const pga = getMaxPGA(station);
      const pgv = record.pgv;
      const sa1 = record.sa10;

      // PGA filters
      if (filters.pgaMin !== null && pga < filters.pgaMin) return false;
      if (filters.pgaMax !== null && pga > filters.pgaMax) return false;

      // PGV filters
      if (filters.pgvMin !== null && pgv < filters.pgvMin) return false;
      if (filters.pgvMax !== null && pgv > filters.pgvMax) return false;

      // SA1 filters
      if (filters.sa1Min !== null && sa1 < filters.sa1Min) return false;
      if (filters.sa1Max !== null && sa1 > filters.sa1Max) return false;

      // Visible bounds filter
      if (listVisibleOnly) {
        const bounds = (view as any).bounds;
        if (bounds) {
          const lat = station.latitude;
          const lon = station.longitude;
          const { north, south, east, west } = bounds;
          if (lat < south || lat > north) return false;
          if (lon < west || lon > east) return false;
        }
      }

      return true;
    });

    return filtered.sort((a: Station, b: Station) => {
      const recordA = a.events[0]?.record;
      const recordB = b.events[0]?.record;
      if (!recordA || !recordB) return 0;

      let valA: number, valB: number;
      switch (orderBy.field) {
        case "pga":
          valA = getMaxPGA(a);
          valB = getMaxPGA(b);
          break;
        case "pgv":
          valA = recordA.pgv;
          valB = recordB.pgv;
          break;
        case "sa1":
          valA = recordA.sa10;
          valB = recordB.sa10;
          break;
        case "epidist":
          valA = recordA.epidist;
          valB = recordB.epidist;
          break;
        default:
          return 0;
      }
      return orderBy.direction === "asc" ? valA - valB : valB - valA;
    });
  }, [stations, orderBy, view, listVisibleOnly, filters]);

  useEffect(() => {
    if (evid) {
      fetchRecords();
    }
  }, [evid]);

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
    setView({
      center: [selectedStation.latitude, selectedStation.longitude],
      zoom: view.zoom
    });
    setUpdateMapView(!updateMapView);
  }, [selectedStation]);

  // Scroll selected station into view
  useEffect(() => {
    if (!selectedStation) return;
    const el = document.getElementById(`list-station-${selectedStation.code}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedStation, listVisibleOnly, visibleStations]);

  if (!evid) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold merriweather mb-2">No Event Selected</h1>
          <p className="text-stone-600 mb-4">Please select an event from the earthquakes page.</p>
          <Link href={backUrl} className="text-blue-600 hover:text-blue-800">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Back to Earthquakes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 bg-stone-100 border-r-4 border-stone-300">
      <aside className="w-80 flex flex-col border-r border-stone-300">
        <div className="px-4 pt-4 pb-2 border-b border-b-stone-300">
          {/* Back link and event info */}
          <Link href={backUrl} className="text-blue-600 hover:text-blue-800 text-sm">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Back to Earthquakes
          </Link>
          
          {eventInfo && (
            <div className="mt-2">
              <h2 className="font-large merriweather font-bold">{eventInfo.title}</h2>
              <p className="text-xs text-stone-600">
                M{eventInfo.mag} · {eventInfo.place}
              </p>
            </div>
          )}

          {/* Loading / Error / Count */}
          <div className="mt-2">
            {loading ? (
              <div className="flex items-center text-xs text-stone-600">
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2" />
                Loading records...
              </div>
            ) : error ? (
              <div className="text-xs text-red-800 flex items-center gap-2">
                <span>Error: {error}</span>
                <button
                  className="text-xs text-blue-600 underline ml-2"
                  onClick={() => fetchRecords()}
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-xs">Showing {visibleStations.length} of {stations.length} station{stations.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filterOpen ? 'max-h-500px translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'}`}>
            <FilterRecords filters={filters} onChange={setFilters} />
          </div>

          <div className="mt-2 flex items-center text-s">
            {/* Left: Filter link */}
            <div className="flex-1">
              <button className="text-blue-600 hover:text-blue-700 hover:cursor-pointer text-sm" onClick={() => setFilterOpen(!filterOpen)}>
                <FontAwesomeIcon icon={filterOpen ? faCircleXmark : faFilter} /> {filterOpen ? 'Close' : 'Filter'}
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
                <option value="pga">PGA</option>
                <option value="pgv">PGV</option>
                <option value="sa1">SA(1.0)</option>
                <option value="epidist">Distance</option>
              </select>

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
            Only list stations visible in map
          </label>
        </div>

        <div className="flex-1 overflow-auto p-0 m-0" role="list">
          {visibleStations.map((station: Station, i) => {
            const record = station.events[0]?.record;
            const pga = getMaxPGA(station);
            
            return (
              <div key={station.code} id={`list-station-${station.code}`} className="w-full" role="listitem">
                <div 
                  className={`px-4 py-2 border-b border-stone-300 ${selectedStation?.code === station.code ? 'bg-purple-200 border-t-5 border-t-purple-400' : 'bg-stone-50 hover:bg-stone-100 cursor-pointer'}`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex gap-3 items-start">
                    {/* Left column - PGA indicator */}
                    <div className="shrink-0">
                      <div 
                        className="w-10 h-7 text-xs font-bold flex items-center justify-center border border-stone-500"
                        style={{ backgroundColor: pgaToColor(pga) }}
                      >
                        {station.code}
                      </div>
                    </div>

                    {/* Right content */}
                    <div className="flex-1 min-w-0">
                      <p className="leading-tight text-sm truncate">{station.name}</p>
                      <p className="text-xs text-stone-500">
                        PGA: {pga.toFixed(4)}g · PGV: {record?.pgv?.toFixed(2) ?? '-'} cm/s · Dist: {record?.epidist?.toFixed(1) ?? '-'} km
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
          <Map view={view} updateMapView={updateMapView} onViewChange={(newView) => setView(newView)} legend={<RecordLegend />}>
            {visibleStations.map((station: Station) => (
              <StationMarker 
                key={station.code} 
                station={station} 
                onSelect={() => setSelectedStation(station)} 
                isSelected={selectedStation?.code === station.code} 
              />
            ))}
            {eventInfo && (
              <EpicenterMarker 
                latitude={eventInfo.latitude} 
                longitude={eventInfo.longitude} 
                depth={eventInfo.depth}
                magnitude={eventInfo.mag}
              />
            )}
          </Map>
          
          {/* Floating panel (animated) */}
          <div className={`absolute top-4 right-4 w-80 p-4 bg-white border border-stone-300 transform transition-all duration-300 ease-in-out ${panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`} style={{ zIndex: 100000 }} aria-hidden={!panelOpen}>
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
                <p className="text-sm text-stone-600">{selectedStation.network} · {selectedStation.type}</p>
                
                <p className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
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
                </p>

                {selectedStation.events[0]?.record && (
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm mb-1">Record Data</h3>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">PGA:</span> {getMaxPGA(selectedStation).toFixed(4)} g
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">PGV:</span> {selectedStation.events[0].record.pgv?.toFixed(2) ?? '-'} cm/s
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">PGD:</span> {selectedStation.events[0].record.pgd?.toFixed(2) ?? '-'} cm
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">Epicentral Dist:</span> {selectedStation.events[0].record.epidist?.toFixed(1) ?? '-'} km
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">SA(0.3):</span> {selectedStation.events[0].record.sa03?.toFixed(4) ?? '-'}
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">SA(1.0):</span> {selectedStation.events[0].record.sa10?.toFixed(4) ?? '-'}
                      </div>
                      <div className="bg-stone-100 p-1.5">
                        <span className="font-medium">SA(3.0):</span> {selectedStation.events[0].record.sa30?.toFixed(4) ?? '-'}
                      </div>
                    </div>

                    <a
                      href={`http://strongmotioncenter.org/NCESMD/data/${selectedStation.events[0].cesmd_id}/${selectedStation.network.toLowerCase()}${selectedStation.code.toLowerCase()}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block w-full text-center py-2 bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                    >
                      View Record (PDF)
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    }>
      <RecordsContent />
    </Suspense>
  );
}
