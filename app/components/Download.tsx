import { useState, useMemo } from 'react';

interface DownloadProps {
  dataFormats: Record<string, string>;
  buildUrl: (format: string) => string;
  onFormatChange?: (format: string) => void;
}

export default function Download({ dataFormats, buildUrl, onFormatChange }: DownloadProps) {
  const defaultFormat = Object.values(dataFormats)[0] || 'json';
  const [selectedFormat, setSelectedFormat] = useState<string>(defaultFormat);

  const downloadUrl = useMemo(() => buildUrl(selectedFormat), [buildUrl, selectedFormat]);

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
