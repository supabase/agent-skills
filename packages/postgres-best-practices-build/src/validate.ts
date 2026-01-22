import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { generateSectionMap, parseSections } from "./build.js";
import { IMPACT_LEVELS, RULES_DIR } from "./config.js";
import { parseRuleFile } from "./parser.js";
import type { ValidationResult } from "./types.js";

/**
 * Check if an example label indicates a "bad" pattern
 */
function isBadExample(label: string): boolean {
	const lower = label.toLowerCase();
	return (
		lower.includes("incorrect") ||
		lower.includes("wrong") ||
		lower.includes("bad")
	);
}

/**
 * Check if an example label indicates a "good" pattern
 */
function isGoodExample(label: string): boolean {
	const lower = label.toLowerCase();
	return (
		lower.includes("correct") ||
		lower.includes("good") ||
		lower.includes("usage") ||
		lower.includes("implementation") ||
		lower.includes("example") ||
		lower.includes("recommended")
	);
}

/**
 * Validate a single rule file
 */
export function validateRuleFile(
	filePath: string,
	sectionMap?: Record<string, number>,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Generate section map if not provided
	if (!sectionMap) {
		const sections = parseSections();
		sectionMap = generateSectionMap(sections);
	}

	const result = parseRuleFile(filePath, sectionMap);

	// Add parser errors and warnings
	errors.push(...result.errors);
	warnings.push(...result.warnings);

	if (!result.success || !result.rule) {
		return { valid: false, errors, warnings };
	}

	const rule = result.rule;

	// Validate title
	if (!rule.title || rule.title.trim().length === 0) {
		errors.push("Missing or empty title");
	}

	// Validate explanation
	if (!rule.explanation || rule.explanation.trim().length === 0) {
		errors.push("Missing or empty explanation");
	} else if (rule.explanation.length < 50) {
		warnings.push("Explanation is shorter than 50 characters");
	}

	// Validate examples
	if (rule.examples.length === 0) {
		errors.push(
			"Missing examples (need at least one bad and one good example)",
		);
	} else {
		const hasBad = rule.examples.some((e) => isBadExample(e.label));
		const hasGood = rule.examples.some((e) => isGoodExample(e.label));

		if (!hasBad && !hasGood) {
			errors.push("Missing bad/incorrect and good/correct examples");
		} else if (!hasBad) {
			warnings.push("Missing bad/incorrect example (recommended for clarity)");
		} else if (!hasGood) {
			errors.push("Missing good/correct example");
		}

		// Check for code in examples
		const hasCode = rule.examples.some(
			(e) => e.code && e.code.trim().length > 0,
		);
		if (!hasCode) {
			errors.push("Examples have no code");
		}

		// Check for language specification
		for (const example of rule.examples) {
			if (example.code && !example.language) {
				warnings.push(
					`Example "${example.label}" missing language specification`,
				);
			}
		}
	}

	// Validate impact level
	if (!IMPACT_LEVELS.includes(rule.impact)) {
		errors.push(
			`Invalid impact level: ${rule.impact}. Must be one of: ${IMPACT_LEVELS.join(", ")}`,
		);
	}

	// Warning for missing impact description
	if (!rule.impactDescription) {
		warnings.push(
			"Missing impactDescription (recommended for quantifying benefit)",
		);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate all rule files in the rules directory
 */
export function validateAllRules(): {
	totalFiles: number;
	validFiles: number;
	invalidFiles: number;
	results: Map<string, ValidationResult>;
} {
	const results = new Map<string, ValidationResult>();
	let validFiles = 0;
	let invalidFiles = 0;

	// Get all markdown files (excluding _ prefixed files)
	const files = readdirSync(RULES_DIR)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => join(RULES_DIR, f));

	for (const file of files) {
		const result = validateRuleFile(file);
		results.set(basename(file), result);

		if (result.valid) {
			validFiles++;
		} else {
			invalidFiles++;
		}
	}

	return {
		totalFiles: files.length,
		validFiles,
		invalidFiles,
		results,
	};
}

// Run validation when executed directly
const isMainModule =
	process.argv[1]?.endsWith("validate.ts") ||
	process.argv[1]?.endsWith("validate.js");

if (isMainModule) {
	console.log("Validating Postgres best practices rules...\n");

	const { totalFiles, validFiles, invalidFiles, results } = validateAllRules();

	if (totalFiles === 0) {
		console.log("No rule files found (this is expected for initial setup).");
		console.log("Create rule files in: skills/postgres-best-practices/rules/");
		console.log("Use the _template.md as a starting point.\n");
		process.exit(0);
	}

	let hasErrors = false;

	for (const [filename, result] of results) {
		if (!result.valid || result.warnings.length > 0) {
			console.log(`\n${filename}:`);

			for (const error of result.errors) {
				console.log(`  ERROR: ${error}`);
				hasErrors = true;
			}

			for (const warning of result.warnings) {
				console.log(`  WARNING: ${warning}`);
			}
		}
	}

	console.log(`\n${"=".repeat(50)}`);
	console.log(
		`Total: ${totalFiles} files | Valid: ${validFiles} | Invalid: ${invalidFiles}`,
	);

	if (hasErrors) {
		console.log("\nValidation failed. Please fix the errors above.");
		process.exit(1);
	} else {
		console.log("\nValidation passed!");
		process.exit(0);
	}
}
