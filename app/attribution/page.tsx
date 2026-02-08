import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export default function AttributionPage() {
  return (
    <div className="flex-1 bg-stone-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold merriweather mb-6">Data Attribution</h1>

        <div className="space-y-6 text-stone-700 leading-relaxed">
          <p>
            This application was built using strong-motion data from the Center for Engineering 
            Strong-Motion Data (CESMD), a cooperative project of the California Geological Survey 
            and the U.S. Geological Survey. The networks or agencies providing the data are the 
            California Strong Motion Instrumentation Program (CSMIP) and the USGS National Strong 
            Motion Project (NSMP).
          </p>

          <p>
            The interactive maps in this application use Leaflet and OpenStreetMap. ShakeMap data
            is provided by the California Integrated Seismic Network (CISN) and the USGS Earthquake Hazards 
            Program.
          </p>
        </div>

        <div className="flex flex-col gap-1 mt-8 w-60">
          <a
            href="https://www.strongmotioncenter.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 bg-purple-700 text-white hover:bg-purple-600 transition-colors"
          >
            {/* <FontAwesomeIcon icon={faGlobe} className="w-5 h-5" /> */}
            <span className="font-medium">Strong Motion Center</span>
          </a>

          <a
            href="https://github.com/benman604/smc-dataviewer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 bg-stone-800 text-white hover:bg-stone-700 transition-colors"
          >
            <FontAwesomeIcon icon={faGithub} className="w-5 h-5" />
            <span className="font-medium">View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
