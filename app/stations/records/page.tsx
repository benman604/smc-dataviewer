"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
const Map = dynamic(() => import('../../components/Map'), { ssr: false });
const EventMarker = dynamic(() => import('../../components/markers/EventMarker'), { ssr: false });
const StationMarker = dynamic(() => import('../../components/markers/StationMarker'), { ssr: false });
import type { MapView } from "../../components/Map";
import FilterStationRecords from "../../components/filters/FilterStationRecords";
import type { EventFilters } from "../../components/filters/FilterStationRecords";
import EventLegend from "../../components/legends/EventLegend";
import { RecordStation, StationEvent, RecordsResponse, Event, BaseStation } from "../../lib/definitions";
import { timeToIconColor, faultIdToName, parseImplicitUTCToLocal, SMCStationRecordsURL, CISNShakemapURL } from "../../lib/util";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter, faArrowDownWideShort, faArrowUpWideShort, faCircleXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type OrderBy = {
  field: "time" | "magnitude" | "epidist";
  direction: "asc" | "desc";
}

// Convert StationEvent to Event format for EventMarker compatibility
function stationEventToEvent(stationEvent: StationEvent): Event {
  return {
    cesmd_id: stationEvent.cesmd_id,
    geometry: {
      type: 'Point',
      coordinates: [stationEvent.longitude, stationEvent.latitude, stationEvent.depth],
    },
    id: stationEvent.id,
    properties: {
      RecordNum: 1,
      country: stationEvent.country,
      detail: stationEvent.detail,
      faultType: stationEvent.faultType,
      mag: stationEvent.mag,
      magType: stationEvent.magType,
      net: stationEvent.net,
      place: stationEvent.place,
      state: stationEvent.state,
      time: stationEvent.time,
      title: stationEvent.title,
      type: stationEvent.type,
    },
    type: 'Feature',
  };
}

// Convert RecordStation to BaseStation for StationMarker
function recordStationToBase(station: RecordStation): BaseStation {
  return {
    code: station.code,
    network: station.network,
    status: station.status,
    channels: station.channels,
    recorder_type: station.recorder_type,
    numRecorders: station.numRecorders,
    name: station.name,
    location: station.location,
    longitude: station.longitude,
    latitude: station.latitude,
    elevation: station.elevation,
    type: station.type,
    Vs30: station.Vs30,
    siteclass: station.siteclass,
  };
}

function StationRecordsContent() {
  const searchParams = useSearchParams();
  const stcode = searchParams.get('stcode') || '';
  
  const [station, setStation] = useState<RecordStation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<StationEvent | null>(null);
  const [updateMapView, setUpdateMapView] = useState<boolean>(false);
  const [view, setView] = useState<MapView>({
    center: [37.7749, -120.4194],
    zoom: 6,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>({ field: "time", direction: "desc" });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [listVisibleOnly, setListVisibleOnly] = useState<boolean>(false);

  const defaultFilters: EventFilters = {
    startDate: "",
    endDate: "",
    faultTypes: [],
    evName: "",
    magMin: null,
    magMax: null,
  }

  const [filters, setFilters] = useState<EventFilters>(defaultFilters);

  async function fetchStationRecords() {
    if (!stcode) {
      setError("No station code provided");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SMCStationRecordsURL(stcode));
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data: RecordsResponse = await response.json();
      console.log(data);
      
      if (data.results?.stations?.length > 0) {
        const stationData = data.results.stations[0];
        setStation(stationData);
        
        // Center map on station
        setView({
          center: [stationData.latitude, stationData.longitude],
          zoom: 8,
        });
        setUpdateMapView((v) => !v);
      } else {
        setStation(null);
        setError("No station found");
      }
    } catch (err: any) {
      console.error(err);
      setStation(null);
      closeSelectedEvent(true);
      setError(err?.message ?? "Failed to fetch station records");
    } finally {
      setLoading(false);
    }
  }

  // Filter events client-side based on filters
  const visibleEvents = useMemo(() => {
    if (!station) return [];
    
    let filtered = station.events.filter((event: StationEvent) => {
      // Date filters
      if (filters.startDate) {
        const eventDate = new Date(event.time);
        const startDate = new Date(filters.startDate);
        if (eventDate < startDate) return false;
      }
      if (filters.endDate) {
        const eventDate = new Date(event.time);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the whole end day
        if (eventDate > endDate) return false;
      }

      // Fault type filter
      if (filters.faultTypes && filters.faultTypes.length > 0) {
        if (!event.faultType || !filters.faultTypes.includes(event.faultType)) {
          return false;
        }
      }

      // Event name filter
      if (filters.evName) {
        const searchTerm = filters.evName.toLowerCase();
        if (!event.title.toLowerCase().includes(searchTerm) && 
            !event.place.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Magnitude filters
      if (filters.magMin !== null && filters.magMin !== undefined) {
        if (event.mag < filters.magMin) return false;
      }
      if (filters.magMax !== null && filters.magMax !== undefined) {
        if (event.mag > filters.magMax) return false;
      }

      // Bounds filter (if listVisibleOnly is on)
      if (listVisibleOnly) {
        const bounds = (view as any).bounds;
        if (bounds) {
          const lat = event.latitude;
          const lon = event.longitude;
          const { north, south, east, west } = bounds;
          if (lat < south || lat > north) return false;
          if (lon < west || lon > east) return false;
        }
      }

      return true;
    });

    // Sort
    return filtered.sort((a: StationEvent, b: StationEvent) => {
      if (orderBy.field === "time") {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return orderBy.direction === "asc" ? timeA - timeB : timeB - timeA;
      } else if (orderBy.field === "magnitude") {
        const magA = a.mag ?? -Infinity;
        const magB = b.mag ?? -Infinity;
        return orderBy.direction === "asc" ? magA - magB : magB - magA;
      } else if (orderBy.field === "epidist") {
        const distA = a.record?.epidist ?? Infinity;
        const distB = b.record?.epidist ?? Infinity;
        return orderBy.direction === "asc" ? distA - distB : distB - distA;
      }
      return 0;
    });
  }, [station, orderBy, view, listVisibleOnly, filters]);

  useEffect(() => {
    fetchStationRecords();
  }, [stcode]);

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
    setTimeout(() => setSelectedEvent(null), 100);
  }

  useEffect(() => {
    if (selectedEvent === null) return;
    setView({
      center: [selectedEvent.latitude, selectedEvent.longitude],
      zoom: view.zoom
    });
    setUpdateMapView(!updateMapView);
  }, [selectedEvent]);

  // Scroll selected event into view
  useEffect(() => {
    if (!selectedEvent) return;
    const el = document.getElementById(`list-event-${selectedEvent.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedEvent, listVisibleOnly, visibleEvents]);

  // Get station color based on status
  const getStationColor = () => {
    return station?.status === 'Active' ? '#d6932d' : '#cccccc';
  };

  return (
    <div className="flex flex-1 min-h-0 bg-stone-100 border-r-4 border-stone-300">
        <aside className="w-80 flex flex-col border-r border-stone-300">
          <div className="px-4 pt-4 pb-2 border-b border-b-stone-300">
            <Link href="/stations" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
              Back to Stations
            </Link>
            
            
            {/* Station info */}
            {station && (
                <>
                    <h2 className="font-large merriweather font-bold">{station.code} - {station.name}</h2>
                    <p className="text-xs text-stone-500">
                        Lat: {station.latitude.toFixed(4)}, Lon: {station.longitude.toFixed(4)}
                        {station.elevation && <>, Elev: {station.elevation} m</>}
                    </p>
                    <p className="text-xs text-stone-500">
                        {[
                            station.type,
                            station.status,
                            station.Vs30 && `Vs30: ${station.Vs30}`
                        ].filter(Boolean).join(' · ')}
                    </p>
                </>

            //   <div className="mt-2 p-2 bg-stone-50 border border-stone-300 rounded text-sm">
            //     <div className="flex gap-2 items-start">
            //       <div 
            //         className="w-10 h-7 text-xs font-bold flex items-center justify-center border border-stone-500 shrink-0"
            //         style={{ backgroundColor: getStationColor() }}
            //       >
            //         {station.network}
            //       </div>
            //       <div>
            //         <p className="font-semibold">{station.code} - {station.name}</p>
            //         <p className="text-xs text-stone-500">
            //           {station.type} · {station.status}
            //           {station.Vs30 && ` · Vs30: ${station.Vs30}`}
            //         </p>
            //       </div>
            //     </div>
            //   </div>
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
                    onClick={() => fetchStationRecords()}
                  >
                    Retry
                  </button>
                </div>
              ) : station ? (
                <p className="text-xs">Showing {visibleEvents.length} of {station.events.length} earthquake{station.events.length !== 1 ? 's' : ''}</p>
              ) : null}
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filterOpen ? 'max-h-96 translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'}`}>
              <FilterStationRecords filters={filters} onChange={setFilters} />
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
                  <option value="time">time</option>
                  <option value="magnitude">magnitude</option>
                  <option value="epidist">distance</option>
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
              Only list earthquakes visible in map
            </label>
          </div>

          <div className="flex-1 overflow-auto p-0 m-0" role="list">
            {visibleEvents.map((event: StationEvent, i) => (
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
                        style={{ backgroundColor: timeToIconColor(event.time) }}
                      >
                        {event.mag?.toFixed(1) ?? "-"}
                      </div>
                    </div>

                    {/* Right content */}
                    <div className="flex-1">
                      <p className="leading-tight">{event.title}</p>
                      <p className="text-xs text-stone-500">
                        {event.place}, {parseImplicitUTCToLocal(event.time).toLocaleString()}
                      </p>
                      {event.record && (
                        <p className="text-xs text-stone-400">
                          {event.record.epidist?.toFixed(1)} km · PGA: {Math.max(event.record.pgav1 || 0, event.record.pgav2 || 0).toFixed(3)}g
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-h-0">
          <section className="h-full min-h-0 relative overflow-hidden">
            <Map view={view} updateMapView={updateMapView} onViewChange={(newView) => setView(newView)} legend={<EventLegend />}>
              {/* Station marker */}
              {station && (
                <StationMarker
                  station={recordStationToBase(station)}
                  fillColor={getStationColor()}
                  isSelected={true}
                />
              )}
              {/* Event markers */}
              {visibleEvents.toReversed().map((event: StationEvent, i) => (
                <EventMarker 
                  key={i} 
                  event={stationEventToEvent(event)} 
                  onSelect={() => setSelectedEvent(event)} 
                  isSelected={selectedEvent?.id === event.id} 
                />
              ))}
            </Map>
            
            {/* Floating panel (animated) */}
            <div className={`absolute top-4 w-80 p-4 bg-white border border-stone-300 transition-all duration-300 ease-in-out ${panelOpen ? 'right-4 opacity-100 pointer-events-auto' : 'right-[-22rem] opacity-0 pointer-events-none'}`} style={{ zIndex: 100000 }} aria-hidden={!panelOpen}>
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
                  <h2 className="font-bold">{selectedEvent.magType} {selectedEvent.mag} {selectedEvent.title}</h2>
                  <p>{new Date(selectedEvent.time).toLocaleString()} UTC</p>
                  <p className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      <span className="font-medium text-stone-700">Lat</span>
                      {selectedEvent.latitude}
                      <span className="font-medium text-stone-700">Lon</span>
                      {selectedEvent.longitude}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      <span className="font-medium text-stone-700">Depth</span>
                      {selectedEvent.depth} km
                    </span>

                    {selectedEvent.faultType &&
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                        {faultIdToName(selectedEvent.faultType)}
                        <span className="font-medium text-stone-700">Fault</span>
                      </span>
                    }

                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                      {selectedEvent.id}
                    </span>
                  </p>

                  {/* Record data */}
                  {selectedEvent.record && (
                    <div className="mt-3">
                      <h3 className="font-semibold text-sm mb-1">Record Data</h3>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">PGA (V1):</span> {selectedEvent.record.pgav1?.toFixed(4) ?? '-'} g
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">PGA (V2):</span> {selectedEvent.record.pgav2?.toFixed(4) ?? '-'} g
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">PGV:</span> {selectedEvent.record.pgv?.toFixed(2) ?? '-'} cm/s
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">PGD:</span> {selectedEvent.record.pgd?.toFixed(2) ?? '-'} cm
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">Epicentral Dist:</span> {selectedEvent.record.epidist?.toFixed(1) ?? '-'} km
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">SA(0.3):</span> {selectedEvent.record.sa03?.toFixed(4) ?? '-'}
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">SA(1.0):</span> {selectedEvent.record.sa10?.toFixed(4) ?? '-'}
                        </div>
                        <div className="bg-stone-100 p-1.5">
                          <span className="font-medium">SA(3.0):</span> {selectedEvent.record.sa30?.toFixed(4) ?? '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <Link
                      href={`/events/records?evid=${selectedEvent.id}`}
                      className="flex flex-col items-center py-1 px-2 opacity-70 hover:opacity-100 bg-white cursor-pointer"
                      title="Interactive Map"
                    >
                      <span className="text-sm font-medium">Interactive Map</span>
                      <img src="/iqr_map_icon.jpg" alt="Interactive map icon" className="w-12 h-12 object-cover rounded" />
                    </Link>

                    {CISNShakemapURL(stationEventToEvent(selectedEvent)) && (
                      <a
                        className="flex flex-col items-center py-1 px-2 opacity-70 hover:opacity-100 bg-white cursor-pointer"
                        title="ShakeMap"
                        href={CISNShakemapURL(stationEventToEvent(selectedEvent))}
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

export default function StationRecordsPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}>
      <StationRecordsContent />
    </Suspense>
  );
}
