import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import {
	generateSectionMap,
	getMarkdownFiles,
	parseAllSections,
	parseSections,
} from "./build.js";
import {
	discoverSkills,
	getSkillPaths,
	IMPACT_LEVELS,
	type SkillPaths,
	validateSkillExists,
} from "./config.js";
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
	referencesDir?: string,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Generate section map if not provided
	if (!sectionMap && referencesDir) {
		const sections = parseSections(referencesDir);
		sectionMap = generateSectionMap(sections);
	} else if (!sectionMap) {
		sectionMap = {};
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
 * Extract the `name` field from SKILL.md frontmatter
 */
function extractSkillName(skillFilePath: string): string | null {
	if (!existsSync(skillFilePath)) return null;

	const content = readFileSync(skillFilePath, "utf-8");
	if (!content.startsWith("---")) return null;

	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) return null;

	const frontmatter = content.slice(3, endIndex);
	for (const line of frontmatter.split("\n")) {
		const match = line.match(/^name:\s*(.+)/);
		if (match) return match[1].trim();
	}
	return null;
}

/**
 * Validate SKILL.md structure:
 * - `name` field matches directory name (kebab-case)
 */
function validateSkillStructure(paths: SkillPaths): string[] {
	const errors: string[] = [];
	const skillName = extractSkillName(paths.skillFile);

	if (!skillName) {
		errors.push("SKILL.md is missing the `name` field in frontmatter");
		return errors;
	}

	if (skillName !== paths.name) {
		errors.push(
			`SKILL.md name "${skillName}" does not match directory name "${paths.name}"`,
		);
	}

	// Validate kebab-case format
	if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(paths.name)) {
		errors.push(
			`Directory name "${paths.name}" is not valid kebab-case (lowercase alphanumeric and hyphens only, no leading/trailing/consecutive hyphens)`,
		);
	}

	return errors;
}

/**
 * Validate all reference files for a skill
 */
function validateSkill(paths: SkillPaths): boolean {
	console.log(`[${paths.name}] Validating...`);

	// Validate skill structure (name, kebab-case, H1 heading)
	const nameErrors = validateSkillStructure(paths);
	if (nameErrors.length > 0) {
		for (const error of nameErrors) {
			console.log(`  ERROR: ${error}`);
		}
		return false;
	}

	// Check if references directory exists
	if (!existsSync(paths.referencesDir)) {
		console.log(`  No references directory found.`);
		return true;
	}

	// Get section map (including from subdirectories)
	const sections = parseAllSections(paths.referencesDir);
	const sectionMap = generateSectionMap(sections);

	// Get all markdown files from references/ root (excluding _ prefixed files)
	const files = getMarkdownFiles(paths.referencesDir);

	if (files.length === 0) {
		console.log(`  No rule files found.`);
		return true;
	}

	let validFiles = 0;
	let invalidFiles = 0;
	let hasErrors = false;

	for (const file of files) {
		const result = validateRuleFile(file, sectionMap, paths.referencesDir);
		const filename = basename(file);

		if (result.valid) {
			validFiles++;
		} else {
			invalidFiles++;
		}

		if (!result.valid || result.warnings.length > 0) {
			console.log(`\n  ${filename}:`);

			for (const error of result.errors) {
				console.log(`    ERROR: ${error}`);
				hasErrors = true;
			}

			for (const warning of result.warnings) {
				console.log(`    WARNING: ${warning}`);
			}
		}
	}

	console.log(
		`\n  Total: ${files.length} | Valid: ${validFiles} | Invalid: ${invalidFiles}`,
	);

	return !hasErrors;
}

// Run validation when executed directly
const isMainModule =
	process.argv[1]?.endsWith("validate.ts") ||
	process.argv[1]?.endsWith("validate.js");

if (isMainModule) {
	const targetSkill = process.argv[2];

	if (targetSkill) {
		// Validate specific skill
		if (!validateSkillExists(targetSkill)) {
			console.error(`Error: Skill "${targetSkill}" not found in skills/`);
			const available = discoverSkills();
			if (available.length > 0) {
				console.error(`Available skills: ${available.join(", ")}`);
			}
			process.exit(1);
		}

		const valid = validateSkill(getSkillPaths(targetSkill));
		console.log(valid ? "\n✅ Validation passed!" : "\n❌ Validation failed.");
		process.exit(valid ? 0 : 1);
	} else {
		// Validate all skills
		const skills = discoverSkills();
		if (skills.length === 0) {
			console.log("No skills found in skills/ directory.");
			process.exit(0);
		}

		console.log(`Found ${skills.length} skill(s): ${skills.join(", ")}\n`);

		let allValid = true;
		for (const skill of skills) {
			if (!validateSkill(getSkillPaths(skill))) {
				allValid = false;
			}
			console.log("");
		}

		console.log(
			allValid ? "✅ All validations passed!" : "❌ Some validations failed.",
		);
		process.exit(allValid ? 0 : 1);
	}
}

export { validateSkill };
