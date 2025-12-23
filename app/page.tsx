"use client";
import Map from "./components/Map";
import { MapView } from "./components/Map";
import EventMarker from "./components/EventMarker";
import { Event } from "./lib/definitions";
import { bboxToCenterZoom, timeToColor } from "./lib/util";
import { useState, useEffect } from "react";

export default function Home() {

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [updateMapView, setUpdateMapView] = useState<boolean>(false);
  const [view, setView] = useState<MapView>({
    center: [37.7749, -120.4194],
    zoom: 6,
  });

  useEffect(() => {
    async function fetchEvents() {
      const response = await fetch('https://www.strongmotioncenter.org/wserv/events/query?startdate=2025-12-15&orderby=time&format=json&nodata=404');
      const data = await response.json();
      console.log(data);
      setEvents(data.features);
      if (data.bbox) {
        const { center, zoom } = bboxToCenterZoom(data.bbox);
        setView({ center: [center.lat, center.lon], zoom });
      }
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent === null) return;
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
  }, [selectedEvent]);

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 flex items-center justify-between px-4 border-b border-stone-300" style={{zIndex: 10000000000}}> 
        <div className="flex flex-col">
          <div className="leading-none">
            <span className="text-s">Strong Motion Center</span>
          </div>
          <div className="leading-none libre-baskerville font-bold">
            <span className="text-xl">Data Viewer</span>
          </div>
        </div>
        <div className="flex items-center h-full">
          <button className="px-3 h-full font-semibold" title="Currently viewing earthquakes">Earthquakes</button>
          <button className="px-3 py-1 ml-2 nav-btn">Stations</button>
          <button className="px-3 py-1 ml-2 nav-btn">Archive</button>
          <button className="px-3 py-1 ml-2 nav-btn">Search</button>
          <button className="px-3 py-1 ml-2 nav-btn">Attribution</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 bg-stone-100 border-r-4 border-stone-300">
        <aside className="w-80 flex flex-col border-r border-stone-300">
          <div className="p-4 border-b border-b-stone-300">
            <h2 className="font-large libre-baskerville font-bold">Internet Quick Report</h2>
            <p className="text-xs mt-1">Showing 1033 earthquakes from the past year.</p>

            {/* Time range selector: 2x2 grid of buttons (layout only). Month is highlighted */}
            <div className="mt-3 grid grid-cols-4 gap-1">
              <button className="w-full py-2 text-sm bg-stone-200">Day</button>
              <button className="w-full py-2 text-sm bg-stone-200">Week</button>
              <button className="w-full py-2 text-sm bg-purple-600 text-white">Month</button>
              <button className="w-full py-2 text-sm bg-stone-200">Year</button>
            </div>

            <div className="mt-3 flex items-center text-s">
              {/* Left: Filter link */}
              <div className="flex-1">
                <a href="#" className="text-blue-600 underline hover:text-blue-700">
                  Filter
                </a>
              </div>

              {/* Right: Order by */}
              <div className="flex-2 flex justify-end items-center gap-1 text-stone-600">
                <span>Order by</span>

                {/* Dropdown */}
                <select
                  className="text-xs px-1 py-0.5 border border-stone-300 rounded bg-white focus:outline-none"
                >
                  <option>time</option>
                  <option>magnitude</option>
                </select>

                {/* Sort arrow circle */}
                <div className="h-6 w-6 flex items-center justify-center rounded-full border border-stone-300 bg-white text-[10px] text-stone-600 select-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M6 14l6-6 6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-0 m-0" role="list">
            {events.map((event: Event, i) => (
              <div key={event.id ?? i} id={`list-event-${event.id}`} className="w-full" role="listitem">
                <div 
                  className={`px-4 py-2 border-b border-stone-300 ${selectedEvent?.id === event.id ? 'bg-purple-100 ring-2 ring-purple-400' : 'bg-stone-50 hover:bg-stone-200 cursor-pointer'}`}
                  onClick={() => setSelectedEvent(event)}
                >

                  <div className="flex gap-3 items-start">
                    {/* Left column */}
                    <div className="shrink-0">
                      <div 
                        className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border border-stone-500"
                        style={{ backgroundColor: timeToColor(event.properties.time) }}
                      >
                        {event.properties.mag?.toFixed(1) ?? "-"}
                      </div>
                    </div>

                    {/* Right content */}
                    <div className="flex-1">
                      <p className="leading-tight">{event.properties.title}</p>
                      <p className="text-xs text-stone-500">
                        {event.properties.place}, {new Date(event.properties.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-h-0">
          <section className="h-full min-h-0">
            <Map view={view} updateMapView={updateMapView} onViewChange={(newView) => setView(newView)}>
              {events.map((event: Event, i) => (
                <EventMarker key={i} event={event} onSelect={() => setSelectedEvent(event)} isSelected={selectedEvent === event} />
              ))}
            </Map>
          </section>
        </main>
      </div>
    </div>
  );
}
