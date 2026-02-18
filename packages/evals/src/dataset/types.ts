export interface CodeFixTestCase {
	/** Unique ID, e.g. "supabase/db-rls-mandatory#0" */
	id: string;
	skillName: string;
	referenceFile: string;
	referenceFilename: string;
	title: string;
	explanation: string;
	section: string;
	tags: string[];
	pairIndex: number;
	badExample: {
		label: string;
		description?: string;
		code: string;
		language?: string;
	};
	goodExample: {
		label: string;
		description?: string;
		code: string;
		language?: string;
	};
}
