export const expectedReferenceFiles = [
	"dev-getting-started.md",
	"edge-fun-quickstart.md",
];

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalAssertion } from "../../src/eval-types.js";

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

export const assertions: EvalAssertion[] = [
	{
		name: "CLI_REFERENCE.md exists in project root",
		check: () => findReferenceFile() !== null,
	},
	{
		name: "no hallucinated functions log command",
		check: () => {
			const content = getReferenceContent();
			return (
				!/`supabase\s+functions\s+log`/.test(content) &&
				!/^\s*npx\s+supabase\s+functions\s+log\b/m.test(content) &&
				!/^\s*supabase\s+functions\s+log\b/m.test(content)
			);
		},
	},
	{
		name: "no hallucinated db query command",
		check: () => {
			const content = getReferenceContent();
			return (
				!/`supabase\s+db\s+query`/.test(content) &&
				!/^\s*npx\s+supabase\s+db\s+query\b/m.test(content) &&
				!/^\s*supabase\s+db\s+query\b/m.test(content)
			);
		},
	},
	{
		name: "mentions supabase functions serve for local development",
		check: () =>
			/supabase\s+functions\s+serve/.test(getReferenceContent().toLowerCase()),
	},
	{
		name: "mentions supabase functions deploy",
		check: () =>
			/supabase\s+functions\s+deploy/.test(getReferenceContent().toLowerCase()),
	},
	{
		name: "mentions psql or SQL Editor or connection string for ad-hoc SQL",
		check: () => {
			const content = getReferenceContent().toLowerCase();
			return (
				/\bpsql\b/.test(content) ||
				/sql\s+editor/.test(content) ||
				/connection\s+string/.test(content) ||
				/supabase\s+db\s+dump/.test(content)
			);
		},
	},
	{
		name: "mentions supabase db push or supabase db reset for migrations",
		check: () => {
			const content = getReferenceContent().toLowerCase();
			return (
				/supabase\s+db\s+push/.test(content) ||
				/supabase\s+db\s+reset/.test(content)
			);
		},
	},
	{
		name: "mentions supabase start for local stack",
		check: () => /supabase\s+start/.test(getReferenceContent().toLowerCase()),
	},
	{
		name: "mentions Dashboard or Logs Explorer for production log viewing",
		check: () => {
			const content = getReferenceContent().toLowerCase();
			return /\bdashboard\b/.test(content) || /logs\s+explorer/.test(content);
		},
	},
	{
		name: "overall quality: uses real CLI commands throughout",
		check: () => {
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
			return positiveMatches >= 5 && hallucinationMatches === 0;
		},
	},
];
