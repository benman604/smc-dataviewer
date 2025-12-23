
"use client";

import { FaultType } from '../lib/definitions'
import { useState } from 'react';

export type Filters = {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    // empty array = Any (no specific fault type filter)
    faultTypes: FaultType[];
    // event name filter (mapped to evname query param)
    evName?: string;
    magMin?: number | null;
    magMax?: number | null;
}

type FilterEventsProps = {
    filters: Filters;
    onChange: (next: Filters) => void;
    onApply: () => void;
}

export default function FilterEvents({ filters, onChange, onApply }: FilterEventsProps) {

    const update = (patch: Partial<Filters>) => {
        onChange({ ...filters, ...patch });
    }

    const toggleFaultType = (type: FaultType, checked: boolean) => {
        const current = new Set(filters.faultTypes || []);
        if (checked) {
            current.add(type);
        } else {
            current.delete(type);
        }
        onChange({ ...filters, faultTypes: Array.from(current) });
    }

    const [error, setError] = useState<string | null>(null);

    const validateAndApply = () => {
        const { startDate, endDate, faultTypes, evName, magMin, magMax } = filters as Filters;

        // dates
        if (startDate && isNaN(Date.parse(startDate))) {
            setError('Start date is not a valid date');
            return;
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            setError('End date is not a valid date');
            return;
        }
        if (startDate && endDate) {
            const s = new Date(startDate);
            const e = new Date(endDate);
            if (s > e) {
                setError('Start date must be before end date');
                return;
            }
        }

        // faultTypes: allow empty (Any) or array of valid FaultType codes
        const ft = (faultTypes || []) as unknown as string[];
        if (!Array.isArray(ft)) {
            setError('Fault types invalid');
            return;
        }
        const allowed = new Set(['NM', 'RV', 'SS']);
        for (const t of ft) {
            if (!allowed.has(t)) {
                setError('Fault types contain invalid value');
                return;
            }
        }

        // evName: only allow letters, numbers, space, dash, underscore
        if (evName && !/^[A-Za-z0-9 _-]*$/.test(evName)) {
            setError('Event name contains invalid characters');
            return;
        }

        // magnitude range
        if (magMin !== null && magMax !== null && magMin !== undefined && magMax !== undefined) {
            if (magMin > magMax) {
                setError('Minimum magnitude must be less than maximum magnitude');
                return;
            }
        }

        // all good
        setError(null);
        onApply();
    }

    return (
        <div className="mt-3 p-2 border border-stone-300 bg-stone-50">
            <p className="text-xs text-stone-600">Date/Time (UTC):</p>
            <div className="flex gap-1 my-1">
                <input
                    type="date"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    value={filters.startDate ?? ""}
                    onChange={(e) => update({ startDate: e.target.value })}
                />
                <p>to</p>
                <input
                    type="date"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    value={filters.endDate ?? ""}
                    onChange={(e) => update({ endDate: e.target.value })}
                />
            </div>

            <p className="text-xs text-stone-600 mt-2">Fault type:</p>
            <div className="flex flex-wrap gap-x-2 ">
                <label key="x" className="flex gap-1">
                    <input
                        type="checkbox"
                        name="any"
                        checked={(filters.faultTypes || []).length === 0}
                        onChange={(e) => {
                            // selecting Any clears specific faultTypes (represented by empty array)
                            if (e.target.checked) onChange({ ...filters, faultTypes: [] });
                        }}
                    />
                    <span>Any</span>
                </label>
                <label key="a" className="flex gap-1">
                    <input
                        type="checkbox"
                        name="normal"
                        checked={(filters.faultTypes || []).includes("NM")}
                        onChange={(e) => toggleFaultType("NM", e.target.checked)}
                    />
                    <span>Normal</span>
                </label>
                <label key="b" className="flex gap-1">
                    <input
                        type="checkbox"
                        name="reverse"
                        checked={(filters.faultTypes || []).includes("RV")}
                        onChange={(e) => toggleFaultType("RV", e.target.checked)}
                    />
                    <span>Reverse</span>
                </label>
                <label key="c" className="flex gap-1">
                    <input
                        type="checkbox"
                        name="strike-slip"
                        checked={(filters.faultTypes || []).includes("SS")}
                        onChange={(e) => toggleFaultType("SS", e.target.checked)}
                    />
                    <span>Strike-slip</span>
                </label>
            </div>

            <p className="text-xs text-stone-600 mt-1">Magnitude:</p>
            <div className="flex gap-1 my-1">
                <input
                    type="number"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    placeholder="Min mag"
                    value={filters.magMin ?? ""}
                    onChange={(e) => update({ magMin: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <p>to</p>
                <input
                    type="number"
                    className="w-full text-xs p-1 border border-stone-300 rounded"
                    placeholder="Max mag"
                    value={filters.magMax ?? ""}
                    onChange={(e) => update({ magMax: e.target.value === "" ? null : Number(e.target.value) })}
                />
            </div>

            <p className="text-xs text-stone-600 mt-1">Earthquake name:</p>
            <input
                type="text"
                className="w-full text-xs p-1 border border-stone-300 rounded"
                placeholder="Name"
                value={filters.evName ?? ""}
                onChange={(e) => update({ evName: e.target.value })}
            />

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

            <button 
                className="mt-2 w-full bg-black text-white text-sm p-1 hover:bg-gray-800 cursor-pointer rounded"
                onClick={validateAndApply}
            >
                Apply Filters
            </button>
        </div>
    )
}