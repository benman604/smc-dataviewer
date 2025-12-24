"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-stone-300" style={{zIndex: 10000000000}}> 
      <div className="flex flex-col">
        <div className="leading-none">
          <span className="text-s">Strong Motion Center</span>
        </div>
        <div className="leading-none libre-baskerville font-bold">
          <span className="text-xl">Data Viewer</span>
        </div>
      </div>
      <nav className="flex items-center h-full">
        <Link 
          href="/" 
          className={`px-3 py-1 nav-btn ${pathname === "/" ? "font-semibold" : ""}`}
          title="Currently viewing earthquakes"
        >
          Earthquakes
        </Link>
        <Link 
          href="/stations" 
          className={`px-3 py-1 ml-2 nav-btn ${pathname === "/stations" ? "font-bold" : ""}`}
        >
          Stations
        </Link>
        <Link 
          href="/archive" 
          className={`px-3 py-1 ml-2 nav-btn ${pathname === "/archive" ? "font-bold" : ""}`}
        >
          Archive
        </Link>
        <Link 
          href="/search" 
          className={`px-3 py-1 ml-2 nav-btn ${pathname === "/search" ? "font-bold" : ""}`}
        >
          Search
        </Link>
        <Link 
          href="/attribution" 
          className={`px-3 py-1 ml-2 nav-btn ${pathname === "/attribution" ? "font-bold" : ""}`}
        >
          Attribution
        </Link>
      </nav>
    </header>
  );
}
