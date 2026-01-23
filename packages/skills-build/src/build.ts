import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
	discoverSkills,
	getSkillPaths,
	type SkillPaths,
	validateSkillExists,
} from "./config.js";
import { parseRuleFile } from "./parser.js";
import {
	filterRulesForProfile,
	listProfiles,
	loadProfile,
} from "./profiles.js";
import type { Metadata, Profile, Rule, Section } from "./types.js";
import { validateRuleFile } from "./validate.js";

/**
 * Parse section definitions from _sections.md
 */
function parseSections(rulesDir: string): Section[] {
	const sectionsFile = join(rulesDir, "_sections.md");
	if (!existsSync(sectionsFile)) {
		console.warn("Warning: _sections.md not found, using empty sections");
		return [];
	}

	const content = readFileSync(sectionsFile, "utf-8");
	const sections: Section[] = [];

	// Match format: Impact and Description on separate lines
	// ## 1. Query Performance (query)
	// **Impact:** CRITICAL
	// **Description:** Description text
	const sectionMatches = content.matchAll(
		/##\s+(\d+)\.\s+([^\n(]+)\s*\((\w+)\)\s*\n\*\*Impact:\*\*\s*(\w+(?:-\w+)?)\s*\n\*\*Description:\*\*\s*([^\n]+)/g,
	);

	for (const match of sectionMatches) {
		sections.push({
			number: parseInt(match[1], 10),
			title: match[2].trim(),
			prefix: match[3].trim(),
			impact: match[4].trim() as Section["impact"],
			description: match[5].trim(),
		});
	}

	return sections;
}

/**
 * Parse SKILL.md frontmatter to extract metadata
 */
function parseSkillFrontmatter(content: string): Record<string, unknown> {
	if (!content.startsWith("---")) {
		return {};
	}

	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) {
		return {};
	}

	const frontmatterContent = content.slice(3, endIndex).trim();
	const result: Record<string, unknown> = {};
	let currentKey = "";
	let inMetadata = false;
	const metadataObj: Record<string, string> = {};

	for (const line of frontmatterContent.split("\n")) {
		// Check for metadata block start
		if (line.trim() === "metadata:") {
			inMetadata = true;
			continue;
		}

		// Handle metadata nested values
		if (inMetadata && line.startsWith("  ")) {
			const colonIndex = line.indexOf(":");
			if (colonIndex !== -1) {
				const key = line.slice(0, colonIndex).trim();
				let value = line.slice(colonIndex + 1).trim();
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.slice(1, -1);
				}
				metadataObj[key] = value;
			}
			continue;
		}

		// End metadata block when we hit a non-indented line
		if (inMetadata && !line.startsWith("  ") && line.trim()) {
			inMetadata = false;
			result.metadata = metadataObj;
		}

		// Handle top-level key-value
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		currentKey = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		if (value) {
			result[currentKey] = value;
		}
	}

	// Ensure metadata is captured if file ends in metadata block
	if (inMetadata && Object.keys(metadataObj).length > 0) {
		result.metadata = metadataObj;
	}

	return result;
}

/**
 * Extract references from SKILL.md body
 */
function extractReferencesFromBody(content: string): string[] {
	const references: string[] = [];
	const lines = content.split("\n");
	let inReferencesSection = false;

	for (const line of lines) {
		if (line.match(/^##\s+References/i)) {
			inReferencesSection = true;
			continue;
		}

		if (inReferencesSection) {
			// Stop at next heading
			if (line.startsWith("## ")) {
				break;
			}

			// Match list items with URLs
			const urlMatch = line.match(/^-\s*(https?:\/\/[^\s]+)/);
			if (urlMatch) {
				references.push(urlMatch[1]);
			}
		}
	}

	return references;
}

/**
 * Load metadata from SKILL.md frontmatter (Agent Skills spec compliant)
 */
function loadMetadata(skillFile: string, skillName: string): Metadata {
	if (!existsSync(skillFile)) {
		return {
			version: "1.0.0",
			organization: "Supabase",
			date: new Date().toLocaleDateString("en-US", {
				month: "long",
				year: "numeric",
			}),
			abstract: `${skillName} guide for developers.`,
			references: [],
		};
	}

	const content = readFileSync(skillFile, "utf-8");
	const frontmatter = parseSkillFrontmatter(content);
	const metadata = (frontmatter.metadata as Record<string, string>) || {};

	return {
		version: metadata.version || "1.0.0",
		organization: metadata.organization || "Supabase",
		date:
			metadata.date ||
			new Date().toLocaleDateString("en-US", {
				month: "long",
				year: "numeric",
			}),
		abstract:
			metadata.abstract ||
			(frontmatter.description as string) ||
			`${skillName} guide for developers.`,
		references: extractReferencesFromBody(content),
	};
}

/**
 * Generate anchor from title
 */
function toAnchor(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-");
}

/**
 * Convert skill name to title (e.g., "postgres-best-practices" -> "Postgres Best Practices")
 */
function skillNameToTitle(skillName: string): string {
	return skillName
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Generate SECTION_MAP from parsed sections
 */
export function generateSectionMap(
	sections: Section[],
): Record<string, number> {
	const map: Record<string, number> = {};
	for (const section of sections) {
		map[section.prefix] = section.number;
	}
	return map;
}

/**
 * Build AGENTS.md for a specific skill
 */
function buildSkill(paths: SkillPaths, profile?: Profile): void {
	const profileSuffix = profile ? `.${profile.name}` : "";
	const outputFile = profile
		? paths.agentsOutput.replace(".md", `${profileSuffix}.md`)
		: paths.agentsOutput;

	console.log(`[${paths.name}] Building AGENTS${profileSuffix}.md...`);

	// Load metadata and sections
	const metadata = loadMetadata(paths.skillFile, paths.name);
	const sections = parseSections(paths.referencesDir);
	const sectionMap = generateSectionMap(sections);
	const skillTitle = skillNameToTitle(paths.name);

	// Check if references directory exists
	if (!existsSync(paths.referencesDir)) {
		console.log(`  No references directory found. Generating empty AGENTS.md.`);
		writeFileSync(outputFile, `# ${skillTitle}\n\nNo rules defined yet.\n`);
		return;
	}

	// Get all reference files
	const referenceFiles = readdirSync(paths.referencesDir)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => join(paths.referencesDir, f));

	if (referenceFiles.length === 0) {
		console.log(`  No reference files found. Generating empty AGENTS.md.`);
	}

	// Parse and validate all rules
	const rules: Rule[] = [];

	for (const file of referenceFiles) {
		const validation = validateRuleFile(file, sectionMap);
		if (!validation.valid) {
			console.error(`  Skipping invalid file ${basename(file)}:`);
			for (const e of validation.errors) {
				console.error(`    - ${e}`);
			}
			continue;
		}

		const result = parseRuleFile(file, sectionMap);
		if (result.success && result.rule) {
			rules.push(result.rule);
		}
	}

	// Filter rules by profile if specified
	let filteredRules = rules;
	if (profile) {
		filteredRules = filterRulesForProfile(rules, profile);
		console.log(
			`  Filtered to ${filteredRules.length} rules for profile "${profile.name}"`,
		);
	}

	// Group rules by section and assign IDs
	const rulesBySection = new Map<number, Rule[]>();

	for (const rule of filteredRules) {
		const sectionRules = rulesBySection.get(rule.section) || [];
		sectionRules.push(rule);
		rulesBySection.set(rule.section, sectionRules);
	}

	// Sort rules within each section and assign IDs
	for (const [sectionNum, sectionRules] of rulesBySection) {
		sectionRules.sort((a, b) => a.title.localeCompare(b.title));
		sectionRules.forEach((rule, index) => {
			rule.id = `${sectionNum}.${index + 1}`;
		});
	}

	// Generate markdown output
	const output: string[] = [];

	// Header
	output.push(`# ${skillTitle}\n`);
	output.push(`**Version ${metadata.version}**`);
	output.push(`${metadata.organization}`);
	output.push(`${metadata.date}\n`);
	output.push(
		"> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.\n",
	);
	output.push("---\n");

	// Abstract
	output.push("## Abstract\n");
	output.push(`${metadata.abstract}\n`);
	output.push("---\n");

	// Table of Contents
	output.push("## Table of Contents\n");

	for (const section of sections) {
		const sectionRules = rulesBySection.get(section.number) || [];
		output.push(
			`${section.number}. [${section.title}](#${toAnchor(section.title)}) - **${section.impact}**`,
		);

		for (const rule of sectionRules) {
			output.push(
				`   - ${rule.id} [${rule.title}](#${toAnchor(`${rule.id}-${rule.title}`)})`,
			);
		}

		output.push("");
	}

	output.push("---\n");

	// Sections and Rules
	for (const section of sections) {
		const sectionRules = rulesBySection.get(section.number) || [];

		output.push(`## ${section.number}. ${section.title}\n`);
		output.push(`**Impact: ${section.impact}**\n`);
		output.push(`${section.description}\n`);

		if (sectionRules.length === 0) {
			output.push(
				"*No rules defined yet. See rules/_template.md for creating new rules.*\n",
			);
		}

		for (const rule of sectionRules) {
			output.push(`### ${rule.id} ${rule.title}\n`);

			if (rule.impactDescription) {
				output.push(`**Impact: ${rule.impact} (${rule.impactDescription})**\n`);
			} else {
				output.push(`**Impact: ${rule.impact}**\n`);
			}

			// Add prerequisites if minVersion or extensions are specified
			const prerequisites: string[] = [];
			if (rule.minVersion) {
				prerequisites.push(`PostgreSQL ${rule.minVersion}+`);
			}
			if (rule.extensions && rule.extensions.length > 0) {
				prerequisites.push(
					`Extension${rule.extensions.length > 1 ? "s" : ""}: ${rule.extensions.join(", ")}`,
				);
			}
			if (prerequisites.length > 0) {
				output.push(`**Prerequisites:** ${prerequisites.join(" | ")}\n`);
			}

			output.push(`${rule.explanation}\n`);

			for (const example of rule.examples) {
				if (example.description) {
					output.push(`**${example.label} (${example.description}):**\n`);
				} else {
					output.push(`**${example.label}:**\n`);
				}

				output.push(`\`\`\`${example.language || "sql"}`);
				output.push(example.code);
				output.push("```\n");

				if (example.additionalText) {
					output.push(`${example.additionalText}\n`);
				}
			}

			if (rule.references && rule.references.length > 0) {
				if (rule.references.length === 1) {
					output.push(`Reference: ${rule.references[0]}\n`);
				} else {
					output.push("References:");
					for (const ref of rule.references) {
						output.push(`- ${ref}`);
					}
					output.push("");
				}
			}

			output.push("---\n");
		}
	}

	// References section
	if (metadata.references && metadata.references.length > 0) {
		output.push("## References\n");
		for (const ref of metadata.references) {
			output.push(`- ${ref}`);
		}
		output.push("");
	}

	// Write output
	writeFileSync(outputFile, output.join("\n"));
	console.log(`  Generated: ${outputFile}`);
	console.log(`  Total rules: ${filteredRules.length}`);
}

/**
 * Parse CLI arguments
 */
function parseArgs(): {
	skill?: string;
	profile?: string;
	allProfiles: boolean;
} {
	const args = process.argv.slice(2);
	let skill: string | undefined;
	let profile: string | undefined;
	let allProfiles = false;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--profile" && args[i + 1]) {
			profile = args[i + 1];
			i++;
		} else if (arg === "--all-profiles") {
			allProfiles = true;
		} else if (!arg.startsWith("--")) {
			skill = arg;
		}
	}

	return { skill, profile, allProfiles };
}

/**
 * Build a skill with all available profiles
 */
function buildSkillWithAllProfiles(paths: SkillPaths): void {
	const profilesDir = join(paths.skillDir, "profiles");
	const profiles = listProfiles(profilesDir);

	// Build default (no profile)
	buildSkill(paths);

	// Build each profile variant
	for (const profileName of profiles) {
		const profile = loadProfile(profilesDir, profileName);
		if (profile) {
			buildSkill(paths, profile);
		}
	}
}

// Run build when executed directly
const isMainModule =
	process.argv[1]?.endsWith("build.ts") ||
	process.argv[1]?.endsWith("build.js");

if (isMainModule) {
	const { skill: targetSkill, profile: profileName, allProfiles } = parseArgs();

	if (targetSkill) {
		// Build specific skill
		if (!validateSkillExists(targetSkill)) {
			console.error(`Error: Skill "${targetSkill}" not found in skills/`);
			const available = discoverSkills();
			if (available.length > 0) {
				console.error(`Available skills: ${available.join(", ")}`);
			}
			process.exit(1);
		}

		const paths = getSkillPaths(targetSkill);

		if (allProfiles) {
			// Build all profile variants
			buildSkillWithAllProfiles(paths);
		} else if (profileName) {
			// Build with specific profile
			const profilesDir = join(paths.skillDir, "profiles");
			const profile = loadProfile(profilesDir, profileName);
			if (!profile) {
				console.error(`Error: Profile "${profileName}" not found`);
				const available = listProfiles(profilesDir);
				if (available.length > 0) {
					console.error(`Available profiles: ${available.join(", ")}`);
				}
				process.exit(1);
			}
			buildSkill(paths, profile);
		} else {
			// Build default
			buildSkill(paths);
		}
	} else {
		// Build all skills
		const skills = discoverSkills();
		if (skills.length === 0) {
			console.log("No skills found in skills/ directory.");
			process.exit(0);
		}

		console.log(`Found ${skills.length} skill(s): ${skills.join(", ")}\n`);
		for (const skill of skills) {
			const paths = getSkillPaths(skill);
			if (allProfiles) {
				buildSkillWithAllProfiles(paths);
			} else {
				buildSkill(paths);
			}
			console.log("");
		}
	}

	console.log("✅ Done!");
}

export { buildSkill, parseSections };
