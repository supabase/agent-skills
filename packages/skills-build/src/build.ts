import {
	existsSync,
	lstatSync,
	readdirSync,
	readFileSync,
	statSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import {
	discoverSkills,
	getSkillPaths,
	type SkillPaths,
	validateSkillExists,
} from "./config.js";
import type { Section } from "./types.js";

/**
 * Generate SECTION_MAP from parsed sections
 */
function generateSectionMap(sections: Section[]): Record<string, number> {
	const map: Record<string, number> = {};
	for (const section of sections) {
		map[section.prefix] = section.number;
	}
	return map;
}

/**
 * Recursively get all markdown files from a directory
 */
function getMarkdownFilesRecursive(dir: string): string[] {
	const files: string[] = [];

	if (!existsSync(dir)) {
		return files;
	}

	const entries = readdirSync(dir);

	for (const entry of entries) {
		// Skip files starting with underscore
		if (entry.startsWith("_")) {
			continue;
		}

		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			// Recursively scan subdirectories
			files.push(...getMarkdownFilesRecursive(fullPath));
		} else if (entry.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Parse section definitions from _sections.md (legacy function for validation)
 */
function parseSections(rulesDir: string): Section[] {
	const sectionsFile = join(rulesDir, "_sections.md");
	if (!existsSync(sectionsFile)) {
		return [];
	}
	return parseSectionsFromFile(sectionsFile);
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

		const currentKey = line.slice(0, colonIndex).trim();
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
 * Parse section definitions from a _sections.md file
 */
function parseSectionsFromFile(filePath: string): Section[] {
	const content = readFileSync(filePath, "utf-8");
	const sections: Section[] = [];

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
 * Parse all _sections.md files from references directory and subdirectories
 */
function parseAllSections(referencesDir: string): Section[] {
	const allSections: Section[] = [];

	// Parse root _sections.md
	const rootSectionsFile = join(referencesDir, "_sections.md");
	if (existsSync(rootSectionsFile)) {
		allSections.push(...parseSectionsFromFile(rootSectionsFile));
	}

	// Scan subdirectories for _sections.md files
	if (existsSync(referencesDir)) {
		const entries = readdirSync(referencesDir);
		for (const entry of entries) {
			const fullPath = join(referencesDir, entry);
			if (statSync(fullPath).isDirectory()) {
				const subSectionsFile = join(fullPath, "_sections.md");
				if (existsSync(subSectionsFile)) {
					allSections.push(...parseSectionsFromFile(subSectionsFile));
				}
			}
		}
	}

	return allSections;
}

/**
 * Get all reference files (excluding _sections.md)
 */
function getReferenceFiles(referencesDir: string): string[] {
	const files: string[] = [];

	if (!existsSync(referencesDir)) {
		return files;
	}

	const entries = readdirSync(referencesDir);

	for (const entry of entries) {
		// Skip files starting with underscore
		if (entry.startsWith("_")) {
			continue;
		}

		const fullPath = join(referencesDir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			// Recursively scan subdirectories
			const subEntries = readdirSync(fullPath);
			for (const subEntry of subEntries) {
				if (!subEntry.startsWith("_") && subEntry.endsWith(".md")) {
					files.push(join(fullPath, subEntry));
				}
			}
		} else if (entry.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
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
 * Create CLAUDE.md symlink pointing to AGENTS.md
 */
function createClaudeSymlink(paths: SkillPaths): void {
	const symlinkPath = paths.claudeSymlink;

	// Remove existing symlink or file if it exists
	if (existsSync(symlinkPath)) {
		const stat = lstatSync(symlinkPath);
		if (stat.isSymbolicLink() || stat.isFile()) {
			unlinkSync(symlinkPath);
		}
	}

	// Create symlink (relative path so it works across environments)
	symlinkSync("AGENTS.md", symlinkPath);
	console.log(`  Created symlink: CLAUDE.md -> AGENTS.md`);
}

/**
 * Build AGENTS.md for a specific skill
 *
 * AGENTS.md is a concise navigation guide for AI agents, NOT a comprehensive
 * documentation dump. It helps agents understand the skill directory structure
 * and how to find information.
 */
function buildSkill(paths: SkillPaths): void {
	console.log(`[${paths.name}] Building AGENTS.md...`);

	// Read SKILL.md for metadata
	const skillContent = existsSync(paths.skillFile)
		? readFileSync(paths.skillFile, "utf-8")
		: "";
	const frontmatter = parseSkillFrontmatter(skillContent);
	const skillTitle = skillNameToTitle(paths.name);
	const description =
		(frontmatter.description as string) || `${skillTitle} skill for AI agents.`;

	// Parse sections if available
	const sections = parseAllSections(paths.referencesDir);
	const referenceFiles = getReferenceFiles(paths.referencesDir);

	// Generate concise AGENTS.md
	const output: string[] = [];

	// Header
	output.push(`# ${paths.name}\n`);
	output.push(`> **Note:** \`CLAUDE.md\` is a symlink to this file.\n`);

	// Brief description
	output.push(`## Overview\n`);
	output.push(`${description}\n`);

	// Directory structure
	output.push(`## Structure\n`);
	output.push("```");
	output.push(`${paths.name}/`);
	output.push(`  SKILL.md       # Main skill file - read this first`);
	output.push(`  AGENTS.md      # This navigation guide`);
	output.push(`  CLAUDE.md      # Symlink to AGENTS.md`);
	if (existsSync(paths.referencesDir)) {
		output.push(`  references/    # Detailed reference files`);
	}
	output.push("```\n");

	// How to use
	output.push(`## Usage\n`);
	output.push(`1. Read \`SKILL.md\` for the main skill instructions`);
	output.push(
		`2. Browse \`references/\` for detailed documentation on specific topics`,
	);
	output.push(
		`3. Reference files are loaded on-demand - read only what you need\n`,
	);

	// Reference sections (if available)
	if (sections.length > 0) {
		output.push(`## Reference Categories\n`);
		output.push(`| Priority | Category | Impact | Prefix |`);
		output.push(`|----------|----------|--------|--------|`);
		for (const section of sections.sort((a, b) => a.number - b.number)) {
			output.push(
				`| ${section.number} | ${section.title} | ${section.impact} | \`${section.prefix}-\` |`,
			);
		}
		output.push("");
		output.push(
			`Reference files are named \`{prefix}-{topic}.md\` (e.g., \`query-missing-indexes.md\`).\n`,
		);
	}

	// Reference file list (just filenames, not content)
	if (referenceFiles.length > 0) {
		output.push(`## Available References\n`);
		const grouped = new Map<string, string[]>();

		for (const file of referenceFiles) {
			const name = basename(file, ".md");
			const prefix = name.split("-")[0];
			const group = grouped.get(prefix) || [];
			group.push(name);
			grouped.set(prefix, group);
		}

		for (const [prefix, files] of grouped) {
			const section = sections.find((s) => s.prefix === prefix);
			const title = section ? section.title : prefix;
			output.push(`**${title}** (\`${prefix}-\`):`);
			for (const file of files.sort()) {
				output.push(`- \`references/${file}.md\``);
			}
			output.push("");
		}
	}

	// Stats
	output.push(`---\n`);
	output.push(
		`*${referenceFiles.length} reference files across ${sections.length} categories*`,
	);

	// Write AGENTS.md
	writeFileSync(paths.agentsOutput, output.join("\n"));
	console.log(`  Generated: ${paths.agentsOutput}`);
	console.log(`  Total references: ${referenceFiles.length}`);

	// Create CLAUDE.md symlink
	createClaudeSymlink(paths);
}

// Run build when executed directly
const isMainModule =
	process.argv[1]?.endsWith("build.ts") ||
	process.argv[1]?.endsWith("build.js");

if (isMainModule) {
	const targetSkill = process.argv[2];

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
		buildSkill(getSkillPaths(targetSkill));
	} else {
		// Build all skills
		const skills = discoverSkills();
		if (skills.length === 0) {
			console.log("No skills found in skills/ directory.");
			process.exit(0);
		}

		console.log(`Found ${skills.length} skill(s): ${skills.join(", ")}\n`);
		for (const skill of skills) {
			buildSkill(getSkillPaths(skill));
			console.log("");
		}
	}

	console.log("✅ Done!");
}

export {
	buildSkill,
	generateSectionMap,
	getMarkdownFilesRecursive,
	getReferenceFiles,
	parseAllSections,
	parseSections,
	skillNameToTitle,
};
