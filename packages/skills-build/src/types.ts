export type ImpactLevel =
	| "CRITICAL"
	| "HIGH"
	| "MEDIUM-HIGH"
	| "MEDIUM"
	| "LOW-MEDIUM"
	| "LOW";

export interface CodeExample {
	label: string;
	description?: string;
	code: string;
	language?: string;
	additionalText?: string;
}

export interface Rule {
	id: string;
	title: string;
	section: number;
	subsection?: number;
	impact: ImpactLevel;
	impactDescription?: string;
	explanation: string;
	examples: CodeExample[];
	references?: string[];
	tags?: string[];
	supabaseNotes?: string;
	minVersion?: string;      // Minimum PostgreSQL version required (e.g., "11", "14")
	extensions?: string[];    // Required PostgreSQL extensions (e.g., ["pg_stat_statements"])
}

export interface Section {
	number: number;
	title: string;
	prefix: string;
	impact: ImpactLevel;
	description: string;
}

export interface Metadata {
	version: string;
	organization: string;
	date: string;
	abstract: string;
	references: string[];
	maintainers?: string[];
}

export interface ParseResult {
	success: boolean;
	rule?: Rule;
	errors: string[];
	warnings: string[];
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface Profile {
	name: string;
	minVersion: string;
	maxVersion?: string;
	extensions: {
		available: string[];
		installable?: string[];
		unavailable: string[];
	};
	excludeRules?: string[];
	notes?: string;
}
