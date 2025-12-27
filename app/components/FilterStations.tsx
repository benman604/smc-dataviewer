"use client";

import { useState } from 'react';
import FilterBase, { BaseFilters, StationType, NETWORK_MAP, STATION_TYPES } from './FilterBase';

export type { StationType };

// Default networks to query
export const DEFAULT_NETWORKS = ['BG', 'BK', 'CE', 'CI', 'LA', 'NC', 'NP', 'TO', 'US', 'WR', '_C'];

export type StationFilters = BaseFilters & {
    networks: string[] | 'default';
    abandoned: boolean;
    stcode: string;
    // Additional station-specific filters
    siteClass: string;
    vs30Min: number | null;
    vs30Max: number | null;
}

type FilterStationsProps = {
    filters: StationFilters;
    onChange: (next: StationFilters) => void;
    onSubmit: () => void;
}

export default function FilterStations({ filters, onChange, onSubmit }: FilterStationsProps) {
    const [expanded, setExpanded] = useState(false);

    const update = (patch: Partial<StationFilters>) => {
        onChange({ ...filters, ...patch });
    }

    const handleNetworkChange = (networkId: string, checked: boolean) => {
        if (filters.networks === 'default') {
            // Switch to custom selection
            if (checked) {
                update({ networks: [networkId] });
            }
        } else {
            if (checked) {
                update({ networks: [...filters.networks, networkId] });
            } else {
                const next = filters.networks.filter(n => n !== networkId);
                update({ networks: next });
            }
        }
    };

    const handleDefaultNetworks = () => {
        update({ networks: 'default' });
    };

    const networkIds = Object.keys(NETWORK_MAP);
    const selectedNetworks = filters.networks === 'default' ? DEFAULT_NETWORKS : filters.networks;

    return (
        <FilterBase filters={filters} onChange={update}>
            <div className="mt-2">
                <p className="text-xs text-stone-600">Code:</p>
                <input
                    type="text"
                    placeholder="e.g. CE24319, AAAK16"
                    className="w-full text-xs p-1 border border-stone-300 rounded bg-white"
                    value={filters.stcode || ''}
                    onChange={(e) => update({ stcode: e.target.value })}
                />
            </div>

            <div className="mt-2">
                <p className="text-xs text-stone-600">Networks:</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 my-1">
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={filters.networks === 'default'}
                            onChange={handleDefaultNetworks}
                        />
                        Default
                    </label>
                    <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Hide networks' : 'Show all networks'}
                    </button>
                    <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => update({ networks: [] })}
                    >
                        Clear selection
                    </button>
                </div>
                {expanded && (
                    <div className="max-h-32 overflow-y-auto border border-stone-200 rounded p-1 mt-1">
                        {networkIds.map((netId) => (
                            <label key={netId} className="flex items-center gap-1 text-xs py-0.5">
                                <input
                                    type="checkbox"
                                    checked={selectedNetworks.includes(netId)}
                                    onChange={(e) => handleNetworkChange(netId, e.target.checked)}
                                />
                                <span className="font-mono">{netId}</span>
                                <span className="text-stone-500 truncate">- {NETWORK_MAP[netId]}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                    <p className="text-xs text-stone-600">Site Class:</p>
                    <select
                        className="w-full text-xs p-1 border border-stone-300 rounded bg-white"
                        value={filters.siteClass || ''}
                        onChange={(e) => update({ siteClass: e.target.value })}
                    >
                        <option value="">Any</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                    </select>
                </div>

                <div>
                    <p className="text-xs text-stone-600">Vs30 (m/s):</p>
                    <div className="flex gap-1">
                        <input
                            type="number"
                            placeholder="Min"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.vs30Min ?? ''}
                            onChange={(e) => update({ vs30Min: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            className="w-full text-xs p-1 border border-stone-300 rounded"
                            value={filters.vs30Max ?? ''}
                            onChange={(e) => update({ vs30Max: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                    </div>
                </div>
            </div>

            <label className="mt-2 flex items-center gap-1 text-xs">
                <input
                    type="checkbox"
                    checked={filters.abandoned}
                    onChange={(e) => update({ abandoned: e.target.checked })}
                />
                Include abandoned stations
            </label>

            <button
                type="button"
                className="mt-3 w-full py-1.5 bg-black text-white text-sm font-medium hover:bg-purple-700 rounded"
                onClick={onSubmit}
            >
                Apply Filters
            </button>
        </FilterBase>
    );
}
