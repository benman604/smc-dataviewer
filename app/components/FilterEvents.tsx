
"use client";

type FaultType = 'NM' | 'RV' | 'SS';
export type Filters = {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    // empty array = Any (no specific fault type filter)
    faultTypes: FaultType[];
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

            <button 
                className="mt-2 w-full bg-black text-white text-sm p-1 hover:bg-gray-800 cursor-pointer"
                onClick={onApply}
            >
                Apply Filters
            </button>
        </div>
    )
}