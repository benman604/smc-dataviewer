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
    const dotSize = 20;
    const pulseSize = 70;

    const icon = L.divIcon({
        className: '',
        html: `
        <div style="
            position: relative;
            width: ${pulseSize}px;
            height: ${pulseSize}px;
        ">
            <!-- Pulsating ring -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${dotSize}px;
                height: ${dotSize}px;
                background-color: rgba(220, 38, 38, 1);
                border-radius: 50%;
                animation: pulse 1.5s ease-out infinite;
            "></div>
            <!-- Center dot -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${dotSize}px;
                height: ${dotSize}px;
                background-color: #dc2626;
                border: 5px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>
        </div>
        <style>
            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -50%) scale(3);
                    opacity: 0;
                }
            }
        </style>
        `,
        iconSize: [pulseSize, pulseSize],
        iconAnchor: [pulseSize / 2, pulseSize / 2]
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
            {/* <Popup>
                <div className="text-sm text-center">
                    <div className="font-bold">Epicenter</div>
                    <div><span className="font-medium">Lat:</span> {latitude.toFixed(4)}</div>
                    <div><span className="font-medium">Lon:</span> {longitude.toFixed(4)}</div>
                    {depth !== undefined && <div><span className="font-medium">Depth:</span> {depth} km</div>}
                </div>
            </Popup> */}
        </Marker>
    );
}
