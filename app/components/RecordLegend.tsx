"use client";

import React from 'react';
import { pgaToColor } from '../lib/util';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

type RecordLegendProps = {
  onClose?: () => void;
}

export default function RecordLegend({ onClose }: RecordLegendProps) {
  const pgaLevels = [
    { label: '>= 0.34g (Very Strong)', pga: 0.34 },
    { label: '>= 0.18g (Strong)', pga: 0.18 },
    { label: '>= 0.092g (Moderate)', pga: 0.092 },
    { label: '>= 0.039g (Light)', pga: 0.039 },
    { label: '>= 0.014g (Weak)', pga: 0.014 },
    { label: '>= 0.003g (Very Weak)', pga: 0.003 },
    { label: '< 0.003g (Minimal)', pga: 0.001 },
  ];

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="font-medium">Legend</div>
        {onClose && (
          <button className="text-stone-500 cursor-pointer" onClick={onClose}>
            <FontAwesomeIcon icon={faCircleXmark} />
          </button>
        )}
      </div>
      <div className="mt-2">
        <div className="font-semibold text-xs">PGA Intensity (color)</div>
        <div className="mt-1 space-y-1">
          {pgaLevels.map((level, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div 
                style={{ 
                  width: 14, 
                  height: 14, 
                  backgroundColor: pgaToColor(level.pga), 
                  border: '1px solid #777' 
                }} 
              />
              <div>{level.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
