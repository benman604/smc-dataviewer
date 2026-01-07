"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

type StationLegendProps = {
  onClose?: () => void;
}

export default function StationLegend({ onClose }: StationLegendProps) {
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
        <div className="font-semibold text-xs">Station Type (shape)</div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#888" stroke="black" strokeWidth="1.5"/>
            </svg>
            <div>Ground</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="#888" stroke="black" strokeWidth="1.5"/>
            </svg>
            <div>Building</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon points="8,2 14,14 2,14" fill="#888" stroke="black" strokeWidth="1.5"/>
            </svg>
            <div>Other (Array, Bridge, Dam, etc.)</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon points="8,2 14,8 8,14 2,8" fill="#888" stroke="black" strokeWidth="1.5"/>
            </svg>
            <div>Inactive/Abandoned</div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-semibold text-xs">Station Status (color)</div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div 
              style={{ 
                width: 14, 
                height: 14, 
                backgroundColor: '#d6932d', 
                border: '1px solid #777' 
              }} 
            />
            <div>Active</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div 
              style={{ 
                width: 14, 
                height: 14, 
                backgroundColor: '#cccccc', 
                border: '1px solid #777' 
              }} 
            />
            <div>Planned/Abandoned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
