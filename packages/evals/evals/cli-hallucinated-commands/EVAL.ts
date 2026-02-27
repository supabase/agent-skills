import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const cwd = process.cwd();

function findReferenceFile(): string | null {
	const candidates = readdirSync(cwd).filter((f) => {
		const lower = f.toLowerCase();
		return (
			lower === "cli_reference.md" ||
			lower === "cli-reference.md" ||
			lower === "clireference.md"
		);
	});
	return candidates.length > 0 ? join(cwd, candidates[0]) : null;
}

function getReferenceContent(): string {
	const file = findReferenceFile();
	if (!file) throw new Error("CLI_REFERENCE.md not found in project root");
	return readFileSync(file, "utf-8");
}

test("CLI_REFERENCE.md exists in project root", () => {
	expect(findReferenceFile() !== null).toBe(true);
});

test("no hallucinated functions log command", () => {
	const content = getReferenceContent();
	expect(
		/`supabase\s+functions\s+log`/.test(content) ||
			/^\s*npx\s+supabase\s+functions\s+log\b/m.test(content) ||
			/^\s*supabase\s+functions\s+log\b/m.test(content),
	).toBe(false);
});

test("no hallucinated db query command", () => {
	const content = getReferenceContent();
	expect(
		/`supabase\s+db\s+query`/.test(content) ||
			/^\s*npx\s+supabase\s+db\s+query\b/m.test(content) ||
			/^\s*supabase\s+db\s+query\b/m.test(content),
	).toBe(false);
});

test("mentions supabase functions serve for local development", () => {
	expect(
		/supabase\s+functions\s+serve/.test(getReferenceContent().toLowerCase()),
	).toBe(true);
});

test("mentions supabase functions deploy", () => {
	expect(
		/supabase\s+functions\s+deploy/.test(getReferenceContent().toLowerCase()),
	).toBe(true);
});

test("mentions psql or SQL Editor or connection string for ad-hoc SQL", () => {
	const content = getReferenceContent().toLowerCase();
	expect(
		/\bpsql\b/.test(content) ||
			/sql\s+editor/.test(content) ||
			/connection\s+string/.test(content) ||
			/supabase\s+db\s+dump/.test(content),
	).toBe(true);
});

test("mentions supabase db push or supabase db reset for migrations", () => {
	const content = getReferenceContent().toLowerCase();
	expect(
		/supabase\s+db\s+push/.test(content) ||
			/supabase\s+db\s+reset/.test(content),
	).toBe(true);
});

test("mentions supabase start for local stack", () => {
	expect(/supabase\s+start/.test(getReferenceContent().toLowerCase())).toBe(
		true,
	);
});

test("mentions Dashboard or Logs Explorer for production log viewing", () => {
	const content = getReferenceContent().toLowerCase();
	expect(/\bdashboard\b/.test(content) || /logs\s+explorer/.test(content)).toBe(
		true,
	);
});

test("overall quality: uses real CLI commands throughout", () => {
	const content = getReferenceContent().toLowerCase();
	const signals = [
		/supabase\s+start/,
		/supabase\s+stop/,
		/supabase\s+functions\s+serve/,
		/supabase\s+functions\s+deploy/,
		/supabase\s+db\s+(push|reset|diff)/,
		/\bpsql\b|\bsql\s+editor\b|\bconnection\s+string\b/,
		/\bdashboard\b|\blogs\s+explorer\b/,
	];
	const hallucinations = [
		/`supabase\s+functions\s+log`/,
		/^\s*npx\s+supabase\s+functions\s+log\b/m,
		/^\s*supabase\s+functions\s+log\b/m,
		/`supabase\s+db\s+query`/,
		/^\s*npx\s+supabase\s+db\s+query\b/m,
		/^\s*supabase\s+db\s+query\b/m,
	];
	const positiveMatches = signals.filter((r) => r.test(content)).length;
	const hallucinationMatches = hallucinations.filter((r) =>
		r.test(content),
	).length;
	expect(positiveMatches >= 5 && hallucinationMatches === 0).toBe(true);
});
