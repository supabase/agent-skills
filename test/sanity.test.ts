import { execSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SKILLS_DIR = join(__dirname, "..", "skills");
const PUBLIC_SKILL_NAMES = [
	"supabase",
	"supabase-postgres-best-practices",
] as const;

type InstallResult = {
	commandExitCode: number;
	commandOutput: string;
	installedSkillNames: string[];
	installDir: string;
};

/**
 * Dynamically discover all skill names from the skills/ directory
 */
function discoverSkillNames(): string[] {
	if (!existsSync(SKILLS_DIR)) {
		return [];
	}

	return readdirSync(SKILLS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => existsSync(join(SKILLS_DIR, entry.name, "SKILL.md")))
		.map((entry) => entry.name);
}

function createPublicSourceSnapshot(): string {
	const sourceDir = mkdtempSync(join(tmpdir(), "agent-skills-source-"));
	cpSync(SKILLS_DIR, join(sourceDir, "skills"), { recursive: true });
	return sourceDir;
}

function runSkillsAdd(sourceDir: string, skillName?: string): InstallResult {
	const installDir = mkdtempSync(join(tmpdir(), "agent-skills-install-"));
	const claudeSkillsDir = join(installDir, ".claude", "skills");
	const skillArg = skillName ? ` --skill ${skillName}` : "";
	let commandOutput: string;
	let commandExitCode: number;

	try {
		commandOutput = execSync(
			`npx skills add ${sourceDir} -a claude-code -y${skillArg}`,
			{
				cwd: installDir,
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
				timeout: 120000, // 2 minute timeout
			},
		);
		commandExitCode = 0;
	} catch (error) {
		const execError = error as {
			stdout?: string;
			stderr?: string;
			status?: number;
		};
		commandOutput = `${execError.stdout ?? ""}\n${execError.stderr ?? ""}`;
		commandExitCode = execError.status ?? 1;
	}

	const installedSkillNames = existsSync(claudeSkillsDir)
		? readdirSync(claudeSkillsDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name)
				.sort()
		: [];

	return {
		commandExitCode,
		commandOutput,
		installedSkillNames,
		installDir,
	};
}

describe("skills add sanity check", () => {
	let publicSourceDir: string;
	let installAllResult: InstallResult;
	const createdInstallDirs: string[] = [];
	const skillNames = discoverSkillNames().sort();

	beforeAll(() => {
		publicSourceDir = createPublicSourceSnapshot();
		installAllResult = runSkillsAdd(publicSourceDir);
		createdInstallDirs.push(installAllResult.installDir);
	});

	afterAll(() => {
		rmSync(publicSourceDir, { recursive: true, force: true });
		for (const installDir of createdInstallDirs) {
			rmSync(installDir, { recursive: true, force: true });
		}
	});

	it("should discover exactly the two public skills", () => {
		expect(skillNames).toEqual([...PUBLIC_SKILL_NAMES]);
		console.log(
			`Discovered ${skillNames.length} skills: ${skillNames.join(", ")}`,
		);
	});

	it("should install all public skills without failing", () => {
		const hasError =
			/\bError\b/i.test(installAllResult.commandOutput) && !/✓/.test(installAllResult.commandOutput);

		if (hasError) {
			console.log("Command output:", installAllResult.commandOutput);
		}

		expect(installAllResult.commandExitCode).toBe(0);
	});

	it("should install exactly the two public skills when installing all", () => {
		expect(installAllResult.installedSkillNames).toEqual([...PUBLIC_SKILL_NAMES]);
	});

	it("should not install skill-creator in the public install flow", () => {
		expect(installAllResult.installedSkillNames).not.toContain("skill-creator");
	});

	it.each(PUBLIC_SKILL_NAMES)(
		"should install only %s when using --skill",
		(skillName) => {
			const result = runSkillsAdd(publicSourceDir, skillName);
			createdInstallDirs.push(result.installDir);
			expect(result.commandExitCode).toBe(0);
			expect(result.installedSkillNames).toEqual([skillName]);
		},
	);

	it("should have SKILL.md in each installed public skill", () => {
		for (const skillName of installAllResult.installedSkillNames) {
			const skillMdPath = join(
				installAllResult.installDir,
				".claude",
				"skills",
				skillName,
				"SKILL.md",
			);
			expect(
				existsSync(skillMdPath),
				`Expected SKILL.md to exist at ${skillMdPath}`,
			).toBe(true);
		}
	});
});
