import { BaseStation, RecordStation } from "../../lib/definitions";
import { pgaToColor, getMaxPGA } from "../../lib/util";
import { Marker } from 'react-leaflet'
import L from 'leaflet';
import { useEffect, useRef } from 'react';

type StationMarkerProps = {
    station: BaseStation;
    onSelect?: () => void;
    isSelected?: boolean;
    fillColor?: string; // Optional override for fill color
};

// Helper to check if station has record data
function hasRecordData(station: BaseStation): station is RecordStation {
    return 'events' in station && Array.isArray((station as RecordStation).events);
}

export default function StationMarker({ station, onSelect, isSelected = false, fillColor }: StationMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);
    
    // If no fillColor provided and station has record data, use PGA color
    // Otherwise use a default gray
    const computedFillColor = fillColor ?? (
        hasRecordData(station) ? pgaToColor(getMaxPGA(station)) : '#888888'
    );
    
    const size = 12;
    const strokeWidth = isSelected ? 3 : 1;
    const iconShape = station.status !== 'Active' ? 'diamond' : 
        station.type == "Ground" ? 'circle' :
        station.type == "Building" ? 'square' : 'triangle';

    const getShapeSVG = () => {
        switch (iconShape) {
            case 'circle':
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <circle cx="${(size + 4) / 2}" cy="${(size + 4) / 2}" r="${size / 2}" 
                            fill="${computedFillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            case 'square':
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <rect x="2" y="2" width="${size}" height="${size}" 
                            fill="${computedFillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            case 'diamond':
                const diamondCenter = (size + 4) / 2;
                const diamondHalf = size / 2;
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <polygon points="${diamondCenter},${diamondCenter - diamondHalf} ${diamondCenter + diamondHalf},${diamondCenter} ${diamondCenter},${diamondCenter + diamondHalf} ${diamondCenter - diamondHalf},${diamondCenter}" 
                            fill="${computedFillColor}" stroke="black" stroke-width="${strokeWidth}"/>
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
                            fill="${computedFillColor}" stroke="black" stroke-width="${strokeWidth}"/>
                    </svg>
                `;
            default:
                return `
                    <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
                        <rect x="2" y="2" width="${size}" height="${size}" 
                            fill="${computedFillColor}" stroke="black" stroke-width="${strokeWidth}"/>
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
