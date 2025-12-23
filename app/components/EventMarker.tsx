import { Event } from "../lib/definitions";
import { timeToIconColor, magToIconDiameter } from "../lib/util";
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet';
import { useEffect, useRef } from 'react';

type EventMarkerProps = {
    event: Event;
    onSelect?: () => void;
    isSelected?: boolean;
};

export default function EventMarker({ event, onSelect, isSelected = false }: EventMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);
    const diameter = magToIconDiameter(event.properties.mag ?? 0);

    const icon = L.divIcon({
        className: '',
        html: `
        <div class="circle-icon" style="
            width:${diameter}px;
            height:${diameter}px;
            line-height:${diameter}px;
            background-color: ${timeToIconColor(event.properties.time)};
            outline: ${isSelected ? 5 : 1}px solid black;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
            font-size: ${diameter / 2.2}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-source-sans-3), sans-serif;
            user-select: none;
        ">
            ${event.properties.mag?.toFixed(1) ?? "-"}
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
            position={[event.geometry.coordinates[1], event.geometry.coordinates[0]]}
            icon={icon}
            ref={markerRef}
            eventHandlers={{
                click: (e) => onSelect && onSelect(),
            }}
        >
            {/* <Popup>
                <div>
                    <h3 className="font-bold">{event.properties.title}</h3>
                </div>
            </Popup> */}
        </Marker>
    );
}