"use client";

import React from 'react';
import { timeToIconColor, magToIconDiameter } from '../../lib/util';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

type EventLegendProps = {
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function EventLegend({ onClose, children }: EventLegendProps) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="font-medium">Legend</div>
        {onClose && <button className="text-stone-500 cursor-pointer" onClick={onClose}>
          <FontAwesomeIcon icon={faCircleXmark} />
        </button>
        }
      </div>
      <div className="mt-2">
        <div className="font-semibold text-xs">Recency (color)</div>
        <div className="mt-1 space-y-1">
          {[
            { label: '<= 1 day', dateOffsetDays: 0 },
            { label: '<= 7 days', dateOffsetDays: 3 },
            { label: '<= 30 days', dateOffsetDays: 15 },
            { label: '<= 365 days', dateOffsetDays: 90 },
            { label: '> 1 year', dateOffsetDays: 400 },
          ].map((d, i) => {
            const sampleDate = new Date(Date.now());
            sampleDate.setDate(sampleDate.getDate() - d.dateOffsetDays);
            // Format as "YYYY-MM-DD HH:MM:SS" to match timeToIconColor's expected format
            const formattedDate = sampleDate.toISOString().replace('T', ' ').slice(0, 19);
            const color = timeToIconColor(formattedDate);
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div style={{ width: 14, height: 14, backgroundColor: color, borderRadius: 8, border: '1px solid #777' }} />
                <div>{d.label}</div>
              </div>
            );
          })}
        </div>

        <div className="font-semibold text-xs mt-2">Magnitude (size)</div>
        <div className="mt-1 space-y-2">
          {[2.5, 3.5, 4.5, 5.5, 6.5].map((m) => {
            const d = magToIconDiameter(m);
            return (
              <div key={m} className="flex items-center gap-2 text-xs">
                <div style={{ width: d, height: d, backgroundColor: '#444', borderRadius: d / 2 }} />
                {m === 6.5 ? <div>{"> " + Math.floor(m)}</div> : <div>{"<= " + Math.ceil(m)}</div>}
              </div>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
