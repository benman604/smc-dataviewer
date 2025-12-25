import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

type EpicenterMarkerProps = {
    latitude: number;
    longitude: number;
    depth?: number;
    magnitude?: number;
};

export default function EpicenterMarker({ latitude, longitude, depth, magnitude }: EpicenterMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);
    const size = 16;

    const icon = L.divIcon({
        className: '',
        html: `
        <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: #cc0000;
            border: 3px solid #800000;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });

    // Ensure epicenter is always on top
    useEffect(() => {
        const marker = markerRef.current;
        if (marker) {
            marker.setZIndexOffset(10000);
        }
    }, []);

    return (
        <Marker 
            position={[latitude, longitude]}
            icon={icon}
            ref={markerRef}
        >
            <Popup>
                <div className="text-sm text-center">
                    <div className="font-bold">Epicenter</div>
                    <div><span className="font-medium">Lat:</span> {latitude.toFixed(4)}</div>
                    <div><span className="font-medium">Lon:</span> {longitude.toFixed(4)}</div>
                    {depth !== undefined && <div><span className="font-medium">Depth:</span> {depth} km</div>}
                </div>
            </Popup>
        </Marker>
    );
}
