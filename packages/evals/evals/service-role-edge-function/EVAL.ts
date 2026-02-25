export const expectedReferenceFiles = [
	"db-security-service-role.md",
	"edge-fun-quickstart.md",
	"edge-db-supabase-client.md",
	"edge-pat-cors.md",
	"edge-pat-error-handling.md",
];

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EvalAssertion } from "../../src/eval-types.js";

import {
	findFunctionFile,
	getFunctionCode,
	getSharedCode,
	getSupabaseDir,
} from "../eval-utils.ts";

const FUNCTION_NAME = "admin-reports";

function getAllCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	return `${code}\n${getSharedCode()}`;
}

export const assertions: EvalAssertion[] = [
	{
		name: "supabase project initialized (config.toml exists)",
		check: () => existsSync(join(getSupabaseDir(), "config.toml")),
	},
	{
		name: "edge function file exists",
		check: () => findFunctionFile(FUNCTION_NAME) !== null,
	},
	{
		name: "uses Deno.env.get for service role key",
		check: () =>
			/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i.test(
				getAllCode(),
			),
	},
	{
		name: "no hardcoded service role key",
		check: () => {
			const allCode = getAllCode();
			const lines = allCode.split("\n");
			const nonCommentLines = lines.filter(
				(line) => !line.trimStart().startsWith("//"),
			);
			return !nonCommentLines.some((line) =>
				/(['"`])eyJ[A-Za-z0-9_-]+\.\1?|(['"`])eyJ[A-Za-z0-9_-]+/.test(line),
			);
		},
	},
	{
		name: "createClient called with service role env var as second argument",
		check: () => {
			const allCode = getAllCode();
			return (
				/createClient/i.test(allCode) &&
				/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i.test(
					allCode,
				)
			);
		},
	},
	{
		name: "service role key env var name does not use NEXT_PUBLIC_ prefix",
		check: () => !/NEXT_PUBLIC_[^'"]*service[_-]?role/i.test(getAllCode()),
	},
	{
		name: "CORS headers present",
		check: () => /Access-Control-Allow-Origin/.test(getAllCode()),
	},
	{
		name: "returns JSON response",
		check: () => {
			const allCode = getAllCode();
			return (
				/content-type['"]\s*:\s*['"]application\/json/i.test(allCode) ||
				/Response\.json/i.test(allCode) ||
				/JSON\.stringify/i.test(allCode)
			);
		},
	},
	{
		name: "overall quality: demonstrates service role Edge Function best practices",
		check: () => {
			const allCode = getAllCode();
			const signals: RegExp[] = [
				/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i,
				/Access-Control-Allow-Origin/,
				/createClient/i,
				/\btry\s*\{/,
				/Response\.json|JSON\.stringify/,
				/Deno\.serve/,
			];
			return signals.filter((r) => r.test(allCode)).length >= 5;
		},
	},
];
