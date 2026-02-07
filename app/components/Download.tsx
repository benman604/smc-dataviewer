import { useState } from 'react';

interface DownloadProps {
  downloadUrl: string;
  dataFormats: Record<string, string>;
  onFormatChange?: (format: string) => void;
}

export default function Download({ downloadUrl, dataFormats, onFormatChange }: DownloadProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>(Object.values(dataFormats)[0] || 'json');
  
  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    onFormatChange?.(format);
  };
  
  return (
    <div className="text-sm text-stone-700 flex flex-col gap-3 mt-2 w-64">
      <div>
        <select 
          value={selectedFormat}
          onChange={(e) => handleFormatChange(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded text-stone-700"
        >
          {Object.entries(dataFormats).map(([name, outtype]) => (
            <option key={outtype} value={outtype}>
              {name}
            </option>
          ))}
        </select>
      </div>
      
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="overflow-wrap break-all text-xs text-blue-600 hover:text-blue-900">
        {downloadUrl}
      </a>
    </div>
  );
}
