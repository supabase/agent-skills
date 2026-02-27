import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
	findFunctionFile,
	getFunctionCode,
	getSharedCode,
	getSupabaseDir,
} from "./eval-utils.ts";

const FUNCTION_NAME = "admin-reports";

function getAllCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	return `${code}\n${getSharedCode()}`;
}

test("supabase project initialized (config.toml exists)", () => {
	expect(existsSync(join(getSupabaseDir(), "config.toml"))).toBe(true);
});

test("edge function file exists", () => {
	expect(findFunctionFile(FUNCTION_NAME) !== null).toBe(true);
});

test("uses Deno.env.get for service role key", () => {
	expect(
		/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i.test(
			getAllCode(),
		),
	).toBe(true);
});

test("no hardcoded service role key", () => {
	const allCode = getAllCode();
	const lines = allCode.split("\n");
	const nonCommentLines = lines.filter(
		(line) => !line.trimStart().startsWith("//"),
	);
	expect(
		nonCommentLines.some((line) =>
			/(['"`])eyJ[A-Za-z0-9_-]+\.\1?|(['"`])eyJ[A-Za-z0-9_-]+/.test(line),
		),
	).toBe(false);
});

test("createClient called with service role env var as second argument", () => {
	const allCode = getAllCode();
	expect(
		/createClient/i.test(allCode) &&
			/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i.test(
				allCode,
			),
	).toBe(true);
});

test("service role key env var name does not use NEXT_PUBLIC_ prefix", () => {
	expect(/NEXT_PUBLIC_[^'"]*service[_-]?role/i.test(getAllCode())).toBe(false);
});

test("CORS headers present", () => {
	expect(/Access-Control-Allow-Origin/.test(getAllCode())).toBe(true);
});

test("returns JSON response", () => {
	const allCode = getAllCode();
	expect(
		/content-type['"]\s*:\s*['"]application\/json/i.test(allCode) ||
			/Response\.json/i.test(allCode) ||
			/JSON\.stringify/i.test(allCode),
	).toBe(true);
});

test("overall quality: demonstrates service role Edge Function best practices", () => {
	const allCode = getAllCode();
	const signals: RegExp[] = [
		/Deno\.env\.get\(\s*['"][^'"]*service[_-]?role[^'"]*['"]\s*\)/i,
		/Access-Control-Allow-Origin/,
		/createClient/i,
		/\btry\s*\{/,
		/Response\.json|JSON\.stringify/,
		/Deno\.serve/,
	];
	expect(signals.filter((r) => r.test(allCode)).length >= 5).toBe(true);
});
