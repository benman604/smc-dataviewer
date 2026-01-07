"use client";

import { FaultType } from '../../lib/definitions'

export type EventFilters = {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    // empty array = Any (no specific fault type filter)
    faultTypes: FaultType[];
    // event name filter (mapped to evname query param)
    evName?: string;
    magMin?: number | null;
    magMax?: number | null;
}

type FilterStationRecordsProps = {
    filters: EventFilters;
    onChange: (next: EventFilters) => void;
    children?: React.ReactNode;
}

export default function FilterStationRecords({ filters, onChange, children }: FilterStationRecordsProps) {

    const update = (patch: Partial<EventFilters>) => {
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
            <div className="flex flex-wrap gap-x-2 text-sm">
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
                        checked={(filters.faultTypes || []).includes("RS")}
                        onChange={(e) => toggleFaultType("RS", e.target.checked)}
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

            {children}
        </div>
    )
}
