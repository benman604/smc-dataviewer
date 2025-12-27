"use client";

import React from 'react';

export const STATION_TYPES = ['Array', 'Ground', 'Building', 'Bridge', 'Dam', 'Tunnel', 'Wharf', 'Other'] as const;
export type StationType = typeof STATION_TYPES[number];

export const NETWORK_MAP: Record<string, string> = {
    '08': 'Hokkaido University',
    'AA': 'Anchorage Strong Motion Network',
    'AK': 'University of Alaska Geophysical Institute',
    'AZ': 'Anza',
    'BG': 'Berkeley Geysers Network',
    'BK': 'Berkeley Digital Seismic Network',
    'C1': 'Red Sismologica Nacional',
    'CB': 'Institute of Geophysics China Earthquake Administration (IGP)',
    'CE': 'California Strong Motion Instrumentation Program',
    'CF': 'Red Acelerografica Nacional de la Comision Federal de Electr',
    'CI': 'California Institute of Technology',
    'CU': 'Albuquerque Seismological Laboratory',
    'C_': 'C&GS',
    'EC': 'Ecuador Seismic Network',
    'ES': 'Spanish Digital Seismic Network',
    'GI': 'Red Sismologica Nacional-Guatemala',
    'G_': 'GEOSCOPE',
    'HV': 'Hawaiian Volcano Observatory Network',
    'IT': 'Italian Strong Motion Network',
    'IU': 'GSN - IRIS/USGS',
    'IV': 'Istituto Nazionale di Geofisica e Vulcanologia',
    'JP': 'Japan Networks',
    'LA': 'Los Angeles Basin Seismic Network',
    'MN': 'Mediterranean Very Broadband Seismographic Network',
    'NC': 'USGS Northern California Regional Network',
    'ND': 'New Caledonia Broadband Seismic Network (SismoCal)',
    'NM': 'New Madrid Seismic Network',
    'NN': 'Nevada Seismic Network',
    'NP': 'National Strong Motion Project',
    'NZ': 'New Zealand',
    'OK': 'Oklahoma Geological Survey',
    'OV': 'Observatorio Vulcanologico y Sismologico de Costa Rica',
    'PA': 'Observatorio Sismico del Occidente de Panamá',
    'PG': 'PG',
    'PR': 'Puerto Rico Strong Motion Program (PRSMP)',
    'TO': 'Caltech Tectonic Observatory',
    'TU': 'Turkey Networks',
    'US': 'National Earthquake Information Center',
    'UW': 'PNSN',
    'WR': 'California Department of Water Resources',
    '_C': 'Chilean Networks',
};

// Base filters shared between stations and records
export type BaseFilters = {
    stationName: string;
    stationTypes: StationType | 'any';
};

type FilterBaseProps = {
    filters: BaseFilters;
    onChange: (patch: Partial<BaseFilters>) => void;
    children?: React.ReactNode;
};

export default function FilterBase({ filters, onChange, children }: FilterBaseProps) {
    return (
        <div className="mt-3 p-2 border border-stone-300 bg-stone-50">
            <p className="text-xs text-stone-600">Station Type:</p>
            <select
                className="w-full text-xs p-1 border border-stone-300 rounded bg-white my-1"
                value={filters.stationTypes}
                onChange={(e) => onChange({ stationTypes: e.target.value as StationType | 'any' })}
            >
                <option value="any">Any</option>
                {STATION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>

            <p className="text-xs text-stone-600 mt-2">Station Name:</p>
            <input
                type="text"
                placeholder="Search by name or code..."
                className="w-full text-xs p-1 border border-stone-300 rounded bg-white"
                value={filters.stationName || ''}
                onChange={(e) => onChange({ stationName: e.target.value })}
            />

            {children}
        </div>
    );
}
