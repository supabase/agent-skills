import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Profile, Rule } from "./types.js";

/**
 * Load a profile from the profiles directory
 */
export function loadProfile(profilesDir: string, profileName: string): Profile | null {
	const profileFile = join(profilesDir, `${profileName}.json`);
	if (!existsSync(profileFile)) {
		return null;
	}

	try {
		return JSON.parse(readFileSync(profileFile, "utf-8"));
	} catch (error) {
		console.error(`Error loading profile ${profileName}:`, error);
		return null;
	}
}

/**
 * List all available profiles in the profiles directory
 */
export function listProfiles(profilesDir: string): string[] {
	if (!existsSync(profilesDir)) {
		return [];
	}

	return readdirSync(profilesDir)
		.filter((f) => f.endsWith(".json"))
		.map((f) => f.replace(".json", ""));
}

/**
 * Compare version strings (e.g., "9.5", "11", "14.2")
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
function compareVersions(a: string, b: string): number {
	const partsA = a.split(".").map(Number);
	const partsB = b.split(".").map(Number);

	const maxLen = Math.max(partsA.length, partsB.length);
	for (let i = 0; i < maxLen; i++) {
		const numA = partsA[i] || 0;
		const numB = partsB[i] || 0;
		if (numA !== numB) {
			return numA - numB;
		}
	}
	return 0;
}

/**
 * Check if a rule is compatible with a profile
 */
export function isRuleCompatibleWithProfile(rule: Rule, profile: Profile): boolean {
	// Check version requirement
	if (rule.minVersion) {
		if (compareVersions(rule.minVersion, profile.minVersion) > 0) {
			// Rule requires a higher version than profile supports
			return false;
		}
		if (profile.maxVersion && compareVersions(rule.minVersion, profile.maxVersion) > 0) {
			// Rule requires a version higher than profile's max
			return false;
		}
	}

	// Check extension requirements
	if (rule.extensions && rule.extensions.length > 0) {
		const allExtensions = [
			...(profile.extensions.available || []),
			...(profile.extensions.installable || []),
		];

		for (const ext of rule.extensions) {
			if (profile.extensions.unavailable?.includes(ext)) {
				// Extension is explicitly unavailable in this profile
				return false;
			}
			if (!allExtensions.includes(ext)) {
				// Extension is not available or installable
				return false;
			}
		}
	}

	// Check if rule is explicitly excluded
	if (profile.excludeRules?.includes(rule.id)) {
		return false;
	}

	return true;
}

/**
 * Filter rules based on profile constraints
 */
export function filterRulesForProfile(rules: Rule[], profile: Profile): Rule[] {
	return rules.filter((rule) => isRuleCompatibleWithProfile(rule, profile));
}
