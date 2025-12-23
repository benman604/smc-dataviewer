
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
		faultType: string | null;
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