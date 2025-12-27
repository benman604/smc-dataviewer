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
    const size = 12;
    const strokeWidth = isSelected ? 3 : 1;
    const iconShape = station.status !== 'Active' ? 'diamond' : 
        station.type == "Ground" ? 'circle' :
        station.type == "Building" ? 'square' : 'triangle';

    const getShapeSVG = () => {
        const fillColor = pgaToColor(pga);
        
        switch (iconShape) {
            case 'circle':
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <circle cx="${(size + 4) / 2}" cy="${(size + 4) / 2}" r="${size / 2}" 
                            fill="${fillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            case 'square':
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <rect x="2" y="2" width="${size}" height="${size}" 
                            fill="${fillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            case 'diamond':
                const diamondCenter = (size + 4) / 2;
                const diamondHalf = size / 2;
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <polygon points="${diamondCenter},${diamondCenter - diamondHalf} ${diamondCenter + diamondHalf},${diamondCenter} ${diamondCenter},${diamondCenter + diamondHalf} ${diamondCenter - diamondHalf},${diamondCenter}" 
                            fill="${fillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            case 'triangle':
                const triWidth = size;
                const triHeight = size;
                const svgWidth = triWidth + 4;
                const svgHeight = triHeight + 4;
                return `
                    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
                        <polygon points="${svgWidth / 2},2 ${svgWidth - 2},${svgHeight - 2} 2,${svgHeight - 2}" 
                            fill="${fillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            default:
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <rect x="2" y="2" width="${size}" height="${size}" 
                            fill="${fillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
        }
    };

    const iconSize = size + 4;
    const icon = L.divIcon({
        className: '',
        html: getShapeSVG(),
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2]
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
