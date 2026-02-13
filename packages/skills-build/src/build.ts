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
import { join } from "node:path";
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
 * Create a symlink, removing any existing file or symlink at the target path
 */
function createSymlink(symlinkPath: string, target: string): void {
	if (existsSync(symlinkPath)) {
		const stat = lstatSync(symlinkPath);
		if (stat.isSymbolicLink() || stat.isFile()) {
			unlinkSync(symlinkPath);
		}
	}

	symlinkSync(target, symlinkPath);
}

/**
 * Build AGENTS.md for a specific skill
 *
 * AGENTS.md = SKILL.md body (frontmatter stripped).
 * CLAUDE.md = symlink to AGENTS.md.
 */
function buildSkill(paths: SkillPaths): void {
	console.log(`[${paths.name}] Building AGENTS.md...`);

	// Read SKILL.md and strip frontmatter
	const skillContent = existsSync(paths.skillFile)
		? readFileSync(paths.skillFile, "utf-8")
		: "";
	const body = extractSkillBody(skillContent);

	// Write AGENTS.md (body only, no frontmatter)
	writeFileSync(paths.agentsOutput, `${body}\n`);
	console.log(`  Generated: ${paths.agentsOutput}`);

	// Create CLAUDE.md -> AGENTS.md symlink
	createSymlink(paths.claudeSymlink, "AGENTS.md");
	console.log(`  Created symlink: CLAUDE.md -> AGENTS.md`);
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
	parseSections,
};
