export type FaultType = 'NM' | 'RS' | 'SS';

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

export type Station = {
	code: string;
	network: string;
	status: string;
	channels: string | null;
	recorder_type: string | null;
	numRecorders: number | null;
	name: string;
	location: string | null;
	longitude: number;
	latitude: number;
	elevation: string | null;
	type: string;
	Vs30: number | null;
	siteclass: string | null;
	events: StationEvent[];
};

export type RecordsResponse = {
	details: {
		status: number;
		url: string;
	};
	count: number;
	results: {
		stations: Station[];
	};
};

