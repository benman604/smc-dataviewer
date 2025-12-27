"use client";

import { useState } from 'react';

const STATION_TYPES = ['Array', 'Ground', 'Building', 'Bridge', 'Dam', 'Tunnel', 'Wharf', 'Other'] as const;
export type StationType = typeof STATION_TYPES[number];

export type RecordFilters = {
    stationName: string;
    pgaMin: number | null;
    pgaMax: number | null;
    pgvMin: number | null;
    pgvMax: number | null;
    sa1Min: number | null;
    sa1Max: number | null;
    stationTypes: StationType[] | 'any';
}

type FilterRecordsProps = {
    filters: RecordFilters;
    onChange: (next: RecordFilters) => void;
}

export default function FilterRecords({ filters, onChange }: FilterRecordsProps) {
    const [error, setError] = useState<string | null>(null);

    const update = (patch: Partial<RecordFilters>) => {
        onChange({ ...filters, ...patch });
    }

    return (
        <div className="mt-3 p-2 border border-stone-300 bg-stone-50">
            <p className="text-xs text-stone-600">Station Type:</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 my-1">
                <label className="flex items-center gap-1 text-xs">
                    <input
                        type="checkbox"
                        checked={filters.stationTypes === 'any'}
                        onChange={() => update({ stationTypes: 'any' })}
                    />
                    Any
                </label>
                {STATION_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={filters.stationTypes !== 'any' && filters.stationTypes.includes(type)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    const current = filters.stationTypes === 'any' ? [] : filters.stationTypes;
                                    update({ stationTypes: [...current, type] });
                                } else {
                                    const current = filters.stationTypes === 'any' ? [] : filters.stationTypes;
                                    const next = current.filter(t => t !== type);
                                    update({ stationTypes: next.length === 0 ? 'any' : next });
                                }
                            }}
                        />
                        {type}
                    </label>
                ))}
            </div>

            <p className="text-xs text-stone-600 mt-2">Station Name:</p>
            <input
                type="text"
                placeholder="Search by name or code..."
                className="w-full text-xs p-1 border border-stone-300 rounded"
                value={filters.stationName || ''}
                onChange={(e) => update({ stationName: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                    <p className="text-xs text-stone-600">PGA (g):</p>
                    <div className="flex gap-1 my-1">
                        <input
                            type="number"
                            placeholder="Min"
                            step="0.001"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.pgaMin ?? ''}
                            onChange={(e) => update({ pgaMin: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            step="0.001"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.pgaMax ?? ''}
                            onChange={(e) => update({ pgaMax: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                    </div>
                </div>

                <div>
                    <p className="text-xs text-stone-600">PGV (cm/s):</p>
                    <div className="flex gap-1 my-1">
                        <input
                            type="number"
                            placeholder="Min"
                            step="0.01"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.pgvMin ?? ''}
                            onChange={(e) => update({ pgvMin: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            step="0.01"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.pgvMax ?? ''}
                            onChange={(e) => update({ pgvMax: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                    </div>
                </div>
            </div>

            {/* <p className="text-xs text-stone-600 mt-1">SA(1.0s):</p>
            <div className="flex gap-1 my-1">
                <input
                    type="number"
                    placeholder="Min"
                    step="0.001"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    value={filters.sa1Min ?? ''}
                    onChange={(e) => update({ sa1Min: e.target.value ? parseFloat(e.target.value) : null })}
                />
                <p>to</p>
                <input
                    type="number"
                    placeholder="Max"
                    step="0.001"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    value={filters.sa1Max ?? ''}
                    onChange={(e) => update({ sa1Max: e.target.value ? parseFloat(e.target.value) : null })}
                />
            </div> */}

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
    );
}
