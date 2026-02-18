import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { CodeFixTestCase } from "./types.js";

function findSkillsRoot(): string {
	let dir = process.cwd();
	for (let i = 0; i < 10; i++) {
		const candidate = join(dir, "skills");
		if (existsSync(candidate)) return candidate;
		const parent = resolve(dir, "..");
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error(
		"Could not find skills/ directory. Run from the repository root or a subdirectory.",
	);
}

const SKILLS_ROOT = findSkillsRoot();

// --- Duplicated from skills-build/src/parser.ts for isolation ---

interface CodeExample {
	label: string;
	description?: string;
	code: string;
	language?: string;
}

function parseFrontmatter(content: string): {
	frontmatter: Record<string, string>;
	body: string;
} {
	const frontmatter: Record<string, string> = {};

	if (!content.startsWith("---")) {
		return { frontmatter, body: content };
	}

	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) {
		return { frontmatter, body: content };
	}

	const frontmatterContent = content.slice(3, endIndex).trim();
	const body = content.slice(endIndex + 3).trim();

	for (const line of frontmatterContent.split("\n")) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		frontmatter[key] = value;
	}

	return { frontmatter, body };
}

function extractTitle(body: string): string | null {
	const match = body.match(/^##\s+(.+)$/m);
	return match ? match[1].trim() : null;
}

interface Section {
	title: string;
	explanation: string;
	examples: CodeExample[];
}

function extractSections(body: string): Section[] {
	const sections: Section[] = [];
	const lines = body.split("\n");

	let currentTitle = "";
	let explanationLines: string[] = [];
	let currentExamples: CodeExample[] = [];
	let currentLabel = "";
	let currentDescription = "";
	let inCodeBlock = false;
	let codeBlockLang = "";
	let codeBlockContent: string[] = [];
	let collectingExplanation = false;

	function flushExample() {
		if (currentLabel && codeBlockContent.length > 0) {
			currentExamples.push({
				label: currentLabel,
				description: currentDescription || undefined,
				code: codeBlockContent.join("\n"),
				language: codeBlockLang || undefined,
			});
		}
		currentLabel = "";
		currentDescription = "";
		codeBlockContent = [];
		codeBlockLang = "";
	}

	function flushSection() {
		if (currentTitle && currentExamples.length > 0) {
			sections.push({
				title: currentTitle,
				explanation: explanationLines.join("\n").trim(),
				examples: currentExamples,
			});
		}
		currentExamples = [];
		explanationLines = [];
	}

	for (const line of lines) {
		if (line.startsWith("## ") && !inCodeBlock) {
			flushExample();
			flushSection();
			currentTitle = line.replace(/^##\s+/, "").trim();
			collectingExplanation = true;
			continue;
		}

		const labelMatch = line.match(
			/^\*\*([^*]+?)(?:\s*\(([^)]+)\))?\s*:\*\*\s*$/,
		);
		if (labelMatch && !inCodeBlock) {
			collectingExplanation = false;
			flushExample();
			currentLabel = labelMatch[1].trim();
			currentDescription = labelMatch[2]?.trim() || "";
			continue;
		}

		if (line.startsWith("```") && !inCodeBlock) {
			collectingExplanation = false;
			inCodeBlock = true;
			codeBlockLang = line.slice(3).trim();
			continue;
		}

		if (line.startsWith("```") && inCodeBlock) {
			inCodeBlock = false;
			continue;
		}

		if (inCodeBlock) {
			codeBlockContent.push(line);
		} else if (collectingExplanation) {
			explanationLines.push(line);
		}
	}

	flushExample();
	flushSection();

	return sections;
}

// --- Duplicated from skills-build/src/validate.ts ---

function isBadExample(label: string): boolean {
	const lower = label.toLowerCase();
	return (
		lower.includes("incorrect") ||
		lower.includes("wrong") ||
		lower.includes("bad")
	);
}

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

// --- Extraction logic ---

function pairExamples(
	examples: CodeExample[],
): Array<{ bad: CodeExample; good: CodeExample }> {
	const pairs: Array<{ bad: CodeExample; good: CodeExample }> = [];

	for (let i = 0; i < examples.length - 1; i++) {
		if (
			isBadExample(examples[i].label) &&
			isGoodExample(examples[i + 1].label)
		) {
			pairs.push({ bad: examples[i], good: examples[i + 1] });
		}
	}

	return pairs;
}

function discoverSkillNames(): string[] {
	if (!existsSync(SKILLS_ROOT)) return [];

	return readdirSync(SKILLS_ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.filter((d) => existsSync(join(SKILLS_ROOT, d.name, "SKILL.md")))
		.map((d) => d.name);
}

function getMarkdownFiles(dir: string): string[] {
	if (!existsSync(dir)) return [];

	return readdirSync(dir)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => join(dir, f));
}

export function extractCodeFixDataset(skillName?: string): CodeFixTestCase[] {
	const skills = skillName ? [skillName] : discoverSkillNames();
	const testCases: CodeFixTestCase[] = [];

	for (const skill of skills) {
		const referencesDir = join(SKILLS_ROOT, skill, "references");
		const files = getMarkdownFiles(referencesDir);

		for (const filePath of files) {
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter, body } = parseFrontmatter(content);
			const fileTitle =
				frontmatter.title || extractTitle(body) || basename(filePath, ".md");
			const tags = frontmatter.tags?.split(",").map((t) => t.trim()) || [];
			const section = basename(filePath, ".md").split("-")[0];

			const sections = extractSections(body);
			let pairIndex = 0;

			for (const sec of sections) {
				const pairs = pairExamples(sec.examples);

				for (const { bad, good } of pairs) {
					testCases.push({
						id: `${skill}/${basename(filePath, ".md")}#${pairIndex}`,
						skillName: skill,
						referenceFile: filePath,
						referenceFilename: basename(filePath),
						title: sec.title || fileTitle,
						explanation: sec.explanation,
						section,
						tags,
						pairIndex,
						badExample: {
							label: bad.label,
							description: bad.description,
							code: bad.code,
							language: bad.language,
						},
						goodExample: {
							label: good.label,
							description: good.description,
							code: good.code,
							language: good.language,
						},
					});
					pairIndex++;
				}
			}
		}
	}

	return testCases;
}
