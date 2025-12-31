
"use client";

import { useState } from 'react';
import FilterEventsBase from './FilterEventsBase';

// Re-export EventFilters type for convenience
export type { EventFilters } from './FilterEventsBase';
import type { EventFilters } from './FilterEventsBase';

type FilterEventsProps = {
    filters: EventFilters;
    onChange: (next: EventFilters) => void;
    onApply: () => void;
}

export default function FilterEvents({ filters, onChange, onApply }: FilterEventsProps) {
    const [error, setError] = useState<string | null>(null);

    const validateAndApply = () => {
        const { startDate, endDate, faultTypes, evName, magMin, magMax } = filters as EventFilters;

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
        const allowed = new Set(['NM', 'RS', 'SS']);
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
        <FilterEventsBase filters={filters} onChange={onChange}>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

            <button 
                className="mt-2 w-full bg-black text-white text-sm p-1 hover:bg-gray-800 cursor-pointer rounded"
                onClick={validateAndApply}
            >
                Search
            </button>
        </FilterEventsBase>
    )
}