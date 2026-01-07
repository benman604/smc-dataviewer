"use client";

import FilterBase, { BaseFilters, StationType } from './FilterBase';

export type { StationType };

export type RecordFilters = BaseFilters & {
    pgaMin: number | null;
    pgaMax: number | null;
    pgvMin: number | null;
    pgvMax: number | null;
    sa1Min: number | null;
    sa1Max: number | null;
}

type FilterEventRecordsProps = {
    filters: RecordFilters;
    onChange: (next: RecordFilters) => void;
}

export default function FilterEventRecords({ filters, onChange }: FilterEventRecordsProps) {
    const update = (patch: Partial<RecordFilters>) => {
        onChange({ ...filters, ...patch });
    }

    return (
        <FilterBase filters={filters} onChange={update}>
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
        </FilterBase>
    );
}
