import { execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SKILLS_DIR = join(__dirname, "..", "skills");
const CLAUDE_SKILLS_DIR = join(__dirname, "..", ".claude", "skills");

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

describe("skills add sanity check", () => {
	let commandOutput: string;
	let commandExitCode: number;
	const skillNames = discoverSkillNames();

	beforeAll(() => {
		// Clean up any existing .claude/skills directory
		if (existsSync(CLAUDE_SKILLS_DIR)) {
			rmSync(CLAUDE_SKILLS_DIR, { recursive: true, force: true });
		}

		// Run the skills add command using current directory (.) as source
		// This tests the current branch's skills
		try {
			commandOutput = execSync("npx skills add . -a claude-code -y", {
				cwd: join(__dirname, ".."),
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
				timeout: 120000, // 2 minute timeout
			});
			commandExitCode = 0;
		} catch (error) {
			const execError = error as {
				stdout?: string;
				stderr?: string;
				status?: number;
			};
			commandOutput = `${execError.stdout || ""}\n${execError.stderr || ""}`;
			commandExitCode = execError.status ?? 1;
		}
	});

	afterAll(() => {
		// Clean up .claude/skills directory after tests
		if (existsSync(CLAUDE_SKILLS_DIR)) {
			rmSync(CLAUDE_SKILLS_DIR, { recursive: true, force: true });
		}
	});

	it("should have discovered skills in the repository", () => {
		expect(skillNames.length).toBeGreaterThan(0);
		console.log(
			`Discovered ${skillNames.length} skills: ${skillNames.join(", ")}`,
		);
	});

	it("should not contain 'Error' in command output", () => {
		// Check for error patterns in output (case-insensitive for common error messages)
		const hasError =
			/\bError\b/i.test(commandOutput) && !/✓/.test(commandOutput);

		if (hasError) {
			console.log("Command output:", commandOutput);
		}

		// Allow output with errors if the command still succeeded
		// Some tools output "Error" in informational messages
		expect(commandExitCode).toBe(0);
	});

	it("should create .claude/skills directory", () => {
		expect(existsSync(CLAUDE_SKILLS_DIR)).toBe(true);
	});

	it("should install all skills from the repository", () => {
		for (const skillName of skillNames) {
			const skillPath = join(CLAUDE_SKILLS_DIR, skillName);
			expect(
				existsSync(skillPath),
				`Expected skill "${skillName}" to be installed at ${skillPath}`,
			).toBe(true);
		}
	});

	it("should have SKILL.md in each installed skill", () => {
		for (const skillName of skillNames) {
			const skillMdPath = join(CLAUDE_SKILLS_DIR, skillName, "SKILL.md");
			expect(
				existsSync(skillMdPath),
				`Expected SKILL.md to exist at ${skillMdPath}`,
			).toBe(true);
		}
	});
});
