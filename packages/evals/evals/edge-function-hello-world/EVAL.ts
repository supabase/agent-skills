import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
	findFunctionFile,
	findSharedCorsFile,
	getFunctionCode,
	getFunctionsDir,
	getSharedCode,
	getSupabaseDir,
} from "./eval-utils.ts";

const FUNCTION_NAME = "hello-world";

function getAllCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	return `${code}\n${getSharedCode()}`;
}

function getCatchBlockCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	const catchIndex = code.search(/\bcatch\b/);
	if (catchIndex === -1) return "";
	return code.slice(catchIndex);
}

test("supabase project initialized", () => {
	expect(existsSync(join(getSupabaseDir(), "config.toml"))).toBe(true);
});

test("function directory exists", () => {
	expect(existsSync(join(getFunctionsDir(), FUNCTION_NAME))).toBe(true);
});

test("function index file exists", () => {
	expect(findFunctionFile(FUNCTION_NAME) !== null).toBe(true);
});

test("uses Deno.serve", () => {
	expect(/Deno\.serve/.test(getFunctionCode(FUNCTION_NAME))).toBe(true);
});

test("returns JSON response", () => {
	const allCode = getAllCode();
	expect(
		/content-type['"]\s*:\s*['"]application\/json/i.test(allCode) ||
			/Response\.json/i.test(allCode) ||
			/JSON\.stringify/i.test(allCode),
	).toBe(true);
});

test("handles OPTIONS preflight", () => {
	const allCode = getAllCode();
	expect(/['"]OPTIONS['"]/.test(allCode) && /\.method/.test(allCode)).toBe(
		true,
	);
});

test("defines CORS headers", () => {
	expect(/Access-Control-Allow-Origin/.test(getAllCode())).toBe(true);
});

test("CORS allows required headers", () => {
	const allCode = getAllCode().toLowerCase();
	expect(
		/access-control-allow-headers/.test(allCode) &&
			/authorization/.test(allCode) &&
			/apikey/.test(allCode),
	).toBe(true);
});

test("error response has CORS headers", () => {
	const catchCode = getCatchBlockCode();
	if (catchCode.length === 0) {
		expect(false).toBe(true);
		return;
	}
	const sharedCode = getSharedCode();
	const directCors =
		/corsHeaders|cors_headers|Access-Control-Allow-Origin/i.test(catchCode);
	const callsSharedHelper =
		/errorResponse|jsonResponse|json_response|error_response/i.test(
			catchCode,
		) && /Access-Control-Allow-Origin/i.test(sharedCode);
	expect(directCors || callsSharedHelper).toBe(true);
});

test("has try-catch for error handling", () => {
	const code = getFunctionCode(FUNCTION_NAME);
	expect(/\btry\s*\{/.test(code) && /\bcatch\b/.test(code)).toBe(true);
});

test("returns proper error status code", () => {
	const catchCode = getCatchBlockCode();
	if (catchCode.length === 0) {
		expect(false).toBe(true);
		return;
	}
	expect(
		/status:\s*(400|500|4\d{2}|5\d{2})/.test(catchCode) ||
			/[,(]\s*(400|500|4\d{2}|5\d{2})\s*[),]/.test(catchCode),
	).toBe(true);
});

test("shared CORS module exists", () => {
	expect(findSharedCorsFile() !== null).toBe(true);
});

test("function imports from shared", () => {
	expect(
		/from\s+['"]\.\.\/(_shared|_utils)/.test(getFunctionCode(FUNCTION_NAME)),
	).toBe(true);
});

test("function uses hyphenated name", () => {
	const dirs = existsSync(getFunctionsDir())
		? readdirSync(getFunctionsDir())
		: [];
	const helloDir = dirs.find((d) => d.includes("hello") && d.includes("world"));
	expect(helloDir !== undefined && /^hello-world$/.test(helloDir)).toBe(true);
});

test("overall quality: demonstrates Edge Function best practices", () => {
	const allCode = getAllCode().toLowerCase();
	const signals = [
		/deno\.serve/,
		/['"]options['"]/,
		/access-control-allow-origin/,
		/\btry\s*\{/,
		/status:\s*(400|500|4\d{2}|5\d{2})|[,(]\s*(400|500|4\d{2}|5\d{2})\s*[),]/,
		/from\s+['"]\.\.\/(_shared|_utils)/,
		/authorization/,
		/apikey/,
	];
	expect(signals.filter((r) => r.test(allCode)).length >= 6).toBe(true);
});
