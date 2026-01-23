import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build package directory
export const BUILD_DIR = join(__dirname, "..");

// Skills root directory
export const SKILLS_ROOT = join(BUILD_DIR, "../../skills");

// Skill paths interface
export interface SkillPaths {
	name: string;
	skillDir: string;
	rulesDir: string;
	agentsOutput: string;
	metadataFile: string;
}

// Discover all valid skills (directories with metadata.json)
export function discoverSkills(): string[] {
	if (!existsSync(SKILLS_ROOT)) return [];

	return readdirSync(SKILLS_ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.filter((d) => existsSync(join(SKILLS_ROOT, d.name, "metadata.json")))
		.map((d) => d.name);
}

// Get paths for a specific skill
export function getSkillPaths(skillName: string): SkillPaths {
	const skillDir = join(SKILLS_ROOT, skillName);
	return {
		name: skillName,
		skillDir,
		rulesDir: join(skillDir, "rules"),
		agentsOutput: join(skillDir, "AGENTS.md"),
		metadataFile: join(skillDir, "metadata.json"),
	};
}

// Validate skill exists
export function validateSkillExists(skillName: string): boolean {
	const paths = getSkillPaths(skillName);
	return existsSync(paths.metadataFile);
}

// Valid impact levels in priority order
export const IMPACT_LEVELS = [
	"CRITICAL",
	"HIGH",
	"MEDIUM-HIGH",
	"MEDIUM",
	"LOW-MEDIUM",
	"LOW",
] as const;
