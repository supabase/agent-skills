import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
	findFunctionFile,
	findSharedCorsFile,
	functionsDir,
	getFunctionCode,
	getSharedCode,
	supabaseDir,
} from "../eval-utils.ts";

const FUNCTION_NAME = "hello-world";
const helloWorldDir = join(functionsDir, FUNCTION_NAME);

/** Read function code + all shared modules combined. */
function getAllCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	return `${code}\n${getSharedCode()}`;
}

/** Extract the code after the first `catch` keyword to the end of the function. */
function getCatchBlockCode(): string {
	const code = getFunctionCode(FUNCTION_NAME);
	const catchIndex = code.search(/\bcatch\b/);
	if (catchIndex === -1) return "";
	return code.slice(catchIndex);
}

test("supabase project initialized", () => {
	expect(existsSync(join(supabaseDir, "config.toml"))).toBe(true);
});

test("function directory exists", () => {
	expect(existsSync(helloWorldDir)).toBe(true);
});

test("function index file exists", () => {
	expect(findFunctionFile(FUNCTION_NAME)).not.toBeNull();
});

test("uses Deno.serve", () => {
	const code = getFunctionCode(FUNCTION_NAME);
	expect(code).toMatch(/Deno\.serve/);
});

test("returns JSON response", () => {
	// Check both the function file and shared modules for JSON response patterns
	const allCode = getAllCode();
	const hasContentTypeHeader =
		/content-type['"]\s*:\s*['"]application\/json/i.test(allCode);
	const hasResponseJson = /Response\.json/i.test(allCode);
	const hasJsonStringify = /JSON\.stringify/i.test(allCode);
	expect(hasContentTypeHeader || hasResponseJson || hasJsonStringify).toBe(
		true,
	);
});

test("handles OPTIONS preflight", () => {
	// OPTIONS handling may be in the function itself or in a shared CORS helper
	const allCode = getAllCode();
	expect(allCode).toMatch(/['"]OPTIONS['"]/);
	expect(allCode).toMatch(/\.method/);
});

test("defines CORS headers", () => {
	const allCode = getAllCode();
	expect(allCode).toMatch(/Access-Control-Allow-Origin/);
});

test("CORS allows required headers", () => {
	const allCode = getAllCode().toLowerCase();
	// Must include authorization and apikey in allowed headers
	expect(allCode).toMatch(/access-control-allow-headers/);
	expect(allCode).toMatch(/authorization/);
	expect(allCode).toMatch(/apikey/);
});

test("error response has CORS headers", () => {
	const catchCode = getCatchBlockCode();
	expect(catchCode.length).toBeGreaterThan(0);
	// The catch block should either directly reference CORS headers, or call
	// a shared helper that includes them (e.g. errorResponse, corsHeaders).
	const sharedCode = getSharedCode();
	// Direct CORS reference in catch block
	const directCors =
		/corsHeaders|cors_headers|Access-Control-Allow-Origin/i.test(catchCode);
	// Calls a shared helper that itself includes CORS headers
	const callsSharedHelper =
		/errorResponse|jsonResponse|json_response|error_response/i.test(
			catchCode,
		) && /Access-Control-Allow-Origin/i.test(sharedCode);
	expect(directCors || callsSharedHelper).toBe(true);
});

test("has try-catch for error handling", () => {
	const code = getFunctionCode(FUNCTION_NAME);
	expect(code).toMatch(/\btry\s*\{/);
	expect(code).toMatch(/\bcatch\b/);
});

test("returns proper error status code", () => {
	const catchCode = getCatchBlockCode();
	expect(catchCode.length).toBeGreaterThan(0);
	// Error response should use status 400 or 500 (not default 200).
	// Match object-style { status: 500 } or function-call-style fn('msg', 500)
	const hasObjectStatus = /status:\s*(400|500|4\d{2}|5\d{2})/.test(catchCode);
	const hasFnArgStatus = /[,(]\s*(400|500|4\d{2}|5\d{2})\s*[),]/.test(
		catchCode,
	);
	expect(hasObjectStatus || hasFnArgStatus).toBe(true);
});

test("shared CORS module exists", () => {
	expect(findSharedCorsFile()).not.toBeNull();
});

test("function imports from shared", () => {
	const code = getFunctionCode(FUNCTION_NAME);
	// Should import from ../_shared/ relative path
	expect(code).toMatch(/from\s+['"]\.\.\/(_shared|_utils)/);
});

test("function uses hyphenated name", () => {
	// The function directory should use hyphens, not underscores
	const dirs = existsSync(functionsDir) ? readdirSync(functionsDir) : [];
	const helloDir = dirs.find((d) => d.includes("hello") && d.includes("world"));
	expect(helloDir).toBeDefined();
	expect(helloDir).toMatch(/^hello-world$/);
});

test("overall quality: demonstrates Edge Function best practices", () => {
	const allCode = getAllCode().toLowerCase();
	// A high-quality Edge Function should contain most of these patterns
	const signals = [
		/deno\.serve/, // Modern Deno.serve API
		/['"]options['"]/, // OPTIONS preflight handling
		/access-control-allow-origin/, // CORS headers defined
		/\btry\s*\{/, // Error handling with try-catch
		/status:\s*(400|500|4\d{2}|5\d{2})|[,(]\s*(400|500|4\d{2}|5\d{2})\s*[),]/, // Proper error status codes
		/from\s+['"]\.\.\/(_shared|_utils)/, // Imports from shared directory
		/authorization/, // Allows authorization header in CORS
		/apikey/, // Allows apikey header in CORS
	];
	const matches = signals.filter((r) => r.test(allCode));
	expect(matches.length).toBeGreaterThanOrEqual(6);
});
