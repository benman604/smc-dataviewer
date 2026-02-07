"use client";

import React from 'react';

export const STATION_TYPES = ['Array', 'Ground', 'Building', 'Bridge', 'Dam', 'Tunnel', 'Wharf', 'Other'] as const;
export type StationType = typeof STATION_TYPES[number];

export const STATION_TYPE_CODES: Record<StationType, string> = {
    'Array': 'A',
    'Ground': 'G',
    'Building': 'B',
    'Bridge': 'Br',
    'Dam': 'D',
    'Tunnel': 'T',
    'Wharf': 'W',
    'Other': 'O',
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
