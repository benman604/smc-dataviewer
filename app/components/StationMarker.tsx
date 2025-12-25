import { Station } from "../lib/definitions";
import { pgaToColor, getMaxPGA } from "../lib/util";
import { Marker } from 'react-leaflet'
import L from 'leaflet';
import { useEffect, useRef } from 'react';

type StationMarkerProps = {
    station: Station;
    onSelect?: () => void;
    isSelected?: boolean;
};

export default function StationMarker({ station, onSelect, isSelected = false }: StationMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);
    const pga = getMaxPGA(station);
    const diameter = 24;

    const icon = L.divIcon({
        className: '',
        html: `
        <div class="station-icon" style="
            width:${diameter}px;
            height:${diameter}px;
            line-height:${diameter}px;
            background-color: ${pgaToColor(pga)};
            outline: ${isSelected ? 4 : 1}px solid black;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-source-sans-3), sans-serif;
            user-select: none;
        ">
            ${station.code}
        </div>
        `,
        iconSize: [diameter, diameter],
        iconAnchor: [diameter / 2, diameter / 2]
    });

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        if (isSelected) {
            marker.setZIndexOffset(1000);
        } else {
            marker.setZIndexOffset(0);
        }

        return () => {
            try { marker.setZIndexOffset(0); } catch (e) { }
        };
    }, [isSelected]);

    return (
        <Marker 
            position={[station.latitude, station.longitude]}
            icon={icon}
            ref={markerRef}
            eventHandlers={{
                click: () => onSelect && onSelect(),
            }}
        />
    );
}
