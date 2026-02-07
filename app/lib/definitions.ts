export type FaultType = 'NM' | 'RS' | 'SS';

export const NETWORK_MAP: Record<string, string> = {
    '08': 'Hokkaido University',
    'AA': 'Anchorage Strong Motion Network',
    'AK': 'University of Alaska Geophysical Institute',
    'AZ': 'Anza',
    'BG': 'Berkeley Geysers Network',
    'BK': 'Berkeley Digital Seismic Network',
    'C1': 'Red Sismologica Nacional',
    'CB': 'Institute of Geophysics China Earthquake Administration (IGP)',
    'CE': 'California Strong Motion Instrumentation Program',
    'CF': 'Red Acelerografica Nacional de la Comision Federal de Electr',
    'CI': 'California Institute of Technology',
    'CU': 'Albuquerque Seismological Laboratory',
    'C_': 'C&GS',
    'EC': 'Ecuador Seismic Network',
    'ES': 'Spanish Digital Seismic Network',
    'GI': 'Red Sismologica Nacional-Guatemala',
    'G_': 'GEOSCOPE',
    'HV': 'Hawaiian Volcano Observatory Network',
    'IT': 'Italian Strong Motion Network',
    'IU': 'GSN - IRIS/USGS',
    'IV': 'Istituto Nazionale di Geofisica e Vulcanologia',
    'JP': 'Japan Networks',
    'LA': 'Los Angeles Basin Seismic Network',
    'MN': 'Mediterranean Very Broadband Seismographic Network',
    'NC': 'USGS Northern California Regional Network',
    'ND': 'New Caledonia Broadband Seismic Network (SismoCal)',
    'NM': 'New Madrid Seismic Network',
    'NN': 'Nevada Seismic Network',
    'NP': 'National Strong Motion Project',
    'NZ': 'New Zealand',
    'OK': 'Oklahoma Geological Survey',
    'OV': 'Observatorio Vulcanologico y Sismologico de Costa Rica',
    'PA': 'Observatorio Sismico del Occidente de Panamá',
    'PG': 'PG',
    'PR': 'Puerto Rico Strong Motion Program (PRSMP)',
    'TO': 'Caltech Tectonic Observatory',
    'TU': 'Turkey Networks',
    'US': 'National Earthquake Information Center',
    'UW': 'PNSN',
    'WR': 'California Department of Water Resources',
    '_C': 'Chilean Networks',
};

// Network colors for station markers (excluding gray which is reserved for abandoned)
export const NETWORK_COLORS: Record<string, string> = {
    '08': '#e6194b',  // red
    'AA': '#3cb44b',  // green
    'AK': '#4363d8',  // blue
    'AZ': '#f58231',  // orange
    'BG': '#911eb4',  // purple
    'BK': '#42d4f4',  // cyan
    'C1': '#f032e6',  // magenta
    'CB': '#bfef45',  // lime
    'CE': '#d6932d',  // golden/tan (California main network)
    'CF': '#469990',  // teal
    'CI': '#9A6324',  // brown
    'CU': '#800000',  // maroon
    'C_': '#aaffc3',  // mint
    'EC': '#808000',  // olive
    'ES': '#000075',  // navy
    'GI': '#a9a9a9',  // dark gray (exception)
    'G_': '#ffd8b1',  // apricot
    'HV': '#e6beff',  // lavender
    'IT': '#fffac8',  // beige
    'IU': '#fabebe',  // pink
    'IV': '#7cb9e8',  // light blue
    'JP': '#c9ffe5',  // aero blue
    'LA': '#b5651d',  // light brown
    'MN': '#de5d83',  // blush
    'NC': '#8B4513',  // saddle brown
    'ND': '#708090',  // slate gray
    'NM': '#ff6961',  // pastel red
    'NN': '#77dd77',  // pastel green
    'NP': '#1e90ff',  // dodger blue
    'NZ': '#ffb347',  // pastel orange
    'OK': '#b19cd9',  // pastel purple
    'OV': '#87ceeb',  // sky blue
    'PA': '#dda0dd',  // plum
    'PG': '#98fb98',  // pale green
    'PR': '#ff69b4',  // hot pink
    'TO': '#20b2aa',  // light sea green
    'TU': '#cd853f',  // peru
    'US': '#4169e1',  // royal blue
    'UW': '#32cd32',  // lime green
    'WR': '#6495ed',  // cornflower blue
    '_C': '#db7093',  // pale violet red
};

// Marker border colors for map themes
export const MARKER_BORDER_LIGHT = 'black';
export const MARKER_BORDER_DARK = '#5e5e5e';

export const SMC_EVENT_DATA_FORMATS: Record<string, string> = {
	'GeoJSON': 'json',
	'QuakeML': 'xml',
	'GeoCSV': 'csv',
	'CSV': 'csvfile',
}

export const SMC_RECORDS_DATA_FORMATS: Record<string, string> = {
	'JSON': 'json',
	'XML': 'xml',
	'CSV': 'csv',
}

export type Event = {
	cesmd_id: string;
	geometry: {
		type: 'Point';
		// [longitude, latitude, depth]
		coordinates: [number, number, number];
	};

	id: string;
	properties: {
		RecordNum: number;
		country: string;
		detail: string;
		faultType: FaultType | null;
		mag: number | null;
		magType: string | null;
		net: string;
		place: string;
		state?: string;
		time: string; // e.g. "2025-12-21 02:53:47"
		title: string;
		type: string; // e.g. "earthquake"

		// allow additional properties without breaking the type
		[key: string]: any;
	};
    
	type: 'Feature';
};

// Base station type - shared between stations list and record stations
export type BaseStation = {
	code: string;
	network: string;
	status: string;
	channels: number | string | null;
	recorder_type: string | null;
	numRecorders: number | null;
	name: string;
	location: string | null;
	longitude: number;
	latitude: number;
	elevation: number | string | null;
	type: string;
	Vs30: number | null;
	siteclass: string | null;
};

// Extended station properties from /stations endpoint
export type StationProperties = BaseStation & {
	comm_code: string | null;
	crl_orientation: string | null;
	effdate: string | null;
	geology: string | null;
	Vs30_info: string | null;
	Info_Vs30Method: string | null;
	Vs30_Method: string | null;
	Vs30_reference: string | null;
	bldtype: string | null;
	bldheight: string | null;
	stationpage: string | null;
};

// GeoJSON Feature for stations endpoint
export type StationFeature = {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [longitude, latitude]
	};
	properties: Omit<StationProperties, 'longitude' | 'latitude'>;
};

// Response from /stations endpoint
export type StationsResponse = {
	type: 'FeatureCollection';
	metadata: {
		url: string;
		title: string;
		status: number;
		api: string;
		count: {
			total: number;
			inactive: number;
		};
	};
	features: StationFeature[];
};

// Station/Record types for the Records page
export type StationRecord = {
	epidist: number;
	pgav1: number;
	pgav2: number;
	pga_str: string | null;
	pgv: number;
	pgd: number;
	sa03: number;
	sa10: number;
	sa30: number;
	fault_dist: number | null;
	data_availability: {
		plot: string;
		processed: string;
		raw: string;
	};
};

export type StationEvent = {
	id: string;
	cesmd_id: string;
	mag: number;
	longitude: number;
	latitude: number;
	depth: number;
	place: string;
	time: string;
	state: string;
	country: string;
	detail: string;
	net: string;
	magType: string;
	faultType: FaultType | null;
	type: string;
	title: string;
	record: StationRecord;
};

// Station with record data (from /records endpoint)
export type RecordStation = BaseStation & {
	events: StationEvent[];
};

// Legacy alias - use RecordStation instead
export type Station = RecordStation;

export type RecordsResponse = {
	details: {
		status: number;
		url: string;
	};
	count: number;
	results: {
		stations: RecordStation[];
	};
};

