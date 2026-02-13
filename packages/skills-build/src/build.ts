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
 * Get all markdown files from a directory (flat, no subdirectories)
 */
function getMarkdownFiles(dir: string): string[] {
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

		// Only include files, skip directories
		if (stat.isFile() && entry.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * @deprecated Use getMarkdownFiles instead - nested directories are not supported
 */
function getMarkdownFilesRecursive(dir: string): string[] {
	return getMarkdownFiles(dir);
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
 * Extract the markdown body from SKILL.md (everything after frontmatter)
 */
function extractSkillBody(content: string): string {
	if (!content.startsWith("---")) {
		return content.trim();
	}

	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) {
		return content.trim();
	}

	return content.slice(endIndex + 3).trim();
}

/**
 * Parse the SKILL.md body into its H1 title and the content after it.
 * The first line of the body must be an H1 heading (e.g., "# Supabase").
 * Returns the title text and the remaining body content.
 */
function parseSkillBodySections(body: string): {
	title: string | null;
	content: string;
} {
	const lines = body.split("\n");
	const firstLine = lines[0]?.trim() ?? "";

	const h1Match = firstLine.match(/^#\s+(.+)$/);
	if (!h1Match) {
		return { title: null, content: body };
	}

	// Everything after the H1 line
	const content = lines.slice(1).join("\n").trim();
	return { title: h1Match[1].trim(), content };
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
 * Parse _sections.md from references directory root only
 * Note: Nested directories are not supported - all reference files should be in references/ root
 */
function parseAllSections(referencesDir: string): Section[] {
	const sectionsFile = join(referencesDir, "_sections.md");
	if (existsSync(sectionsFile)) {
		return parseSectionsFromFile(sectionsFile);
	}
	return [];
}

/**
 * Get all reference files from references/ root (excluding _sections.md)
 * Note: Nested directories are not supported - all reference files should be in references/ root
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

		// Only include files at root level, skip directories
		if (stat.isFile() && entry.endsWith(".md")) {
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
 * Structure: Title > Structure > Usage > SKILL.md body > Reference Categories > Available References
 */
function buildSkill(paths: SkillPaths): void {
	console.log(`[${paths.name}] Building AGENTS.md...`);

	// Read SKILL.md for body content
	const skillContent = existsSync(paths.skillFile)
		? readFileSync(paths.skillFile, "utf-8")
		: "";

	// Parse sections if available
	const sections = parseAllSections(paths.referencesDir);
	const referenceFiles = getReferenceFiles(paths.referencesDir);

	const output: string[] = [];

	// Parse SKILL.md body into title + content
	const skillBody = extractSkillBody(skillContent);
	const { title: skillTitle, content: skillBodyContent } =
		parseSkillBodySections(skillBody);

	// 1. Title (from SKILL.md H1 heading)
	const title = skillTitle || skillNameToTitle(paths.name);
	output.push(`# ${title}\n`);

	// 2. Structure
	output.push(`## Structure\n`);
	output.push("```");
	output.push(`${paths.name}/`);
	output.push(`  SKILL.md       # Main skill file`);
	output.push(`  AGENTS.md      # This file (CLAUDE.md is a symlink)`);
	if (existsSync(paths.referencesDir)) {
		output.push(`  references/    # Detailed reference files`);
	}
	output.push("```\n");

	// 3. Usage
	output.push(`## Usage\n`);
	output.push(
		`1. Browse \`references/\` for detailed documentation on specific topics`,
	);
	output.push(
		`2. Reference files are loaded on-demand - read only what you need\n`,
	);

	// 4. Overview (SKILL.md body content after the H1 title)
	if (skillBodyContent) {
		output.push(`## Overview\n`);
		output.push(skillBodyContent);
		output.push("");
	}

	// 5. Reference Categories (if available)
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

	// 6. Available References (grouped by section)
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
	extractSkillBody,
	generateSectionMap,
	getMarkdownFiles,
	getMarkdownFilesRecursive, // deprecated, use getMarkdownFiles
	getReferenceFiles,
	parseAllSections,
	parseSkillBodySections,
	parseSections,
	skillNameToTitle,
};
