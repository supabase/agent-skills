export const expectedReferenceFiles = [
	"edge-fun-quickstart.md",
	"edge-fun-project-structure.md",
	"edge-pat-cors.md",
	"edge-pat-error-handling.md",
	"dev-getting-started.md",
];

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { EvalAssertion } from "../../src/eval-types.js";

import {
	findFunctionFile,
	findSharedCorsFile,
	getFunctionCode,
	getFunctionsDir,
	getSharedCode,
	getSupabaseDir,
} from "../eval-utils.ts";

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

export const assertions: EvalAssertion[] = [
	{
		name: "supabase project initialized",
		check: () => existsSync(join(getSupabaseDir(), "config.toml")),
	},
	{
		name: "function directory exists",
		check: () => existsSync(join(getFunctionsDir(), FUNCTION_NAME)),
	},
	{
		name: "function index file exists",
		check: () => findFunctionFile(FUNCTION_NAME) !== null,
	},
	{
		name: "uses Deno.serve",
		check: () => /Deno\.serve/.test(getFunctionCode(FUNCTION_NAME)),
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
		name: "handles OPTIONS preflight",
		check: () => {
			const allCode = getAllCode();
			return /['"]OPTIONS['"]/.test(allCode) && /\.method/.test(allCode);
		},
	},
	{
		name: "defines CORS headers",
		check: () => /Access-Control-Allow-Origin/.test(getAllCode()),
	},
	{
		name: "CORS allows required headers",
		check: () => {
			const allCode = getAllCode().toLowerCase();
			return (
				/access-control-allow-headers/.test(allCode) &&
				/authorization/.test(allCode) &&
				/apikey/.test(allCode)
			);
		},
	},
	{
		name: "error response has CORS headers",
		check: () => {
			const catchCode = getCatchBlockCode();
			if (catchCode.length === 0) return false;
			const sharedCode = getSharedCode();
			const directCors =
				/corsHeaders|cors_headers|Access-Control-Allow-Origin/i.test(catchCode);
			const callsSharedHelper =
				/errorResponse|jsonResponse|json_response|error_response/i.test(
					catchCode,
				) && /Access-Control-Allow-Origin/i.test(sharedCode);
			return directCors || callsSharedHelper;
		},
	},
	{
		name: "has try-catch for error handling",
		check: () => {
			const code = getFunctionCode(FUNCTION_NAME);
			return /\btry\s*\{/.test(code) && /\bcatch\b/.test(code);
		},
	},
	{
		name: "returns proper error status code",
		check: () => {
			const catchCode = getCatchBlockCode();
			if (catchCode.length === 0) return false;
			return (
				/status:\s*(400|500|4\d{2}|5\d{2})/.test(catchCode) ||
				/[,(]\s*(400|500|4\d{2}|5\d{2})\s*[),]/.test(catchCode)
			);
		},
	},
	{
		name: "shared CORS module exists",
		check: () => findSharedCorsFile() !== null,
	},
	{
		name: "function imports from shared",
		check: () =>
			/from\s+['"]\.\.\/(_shared|_utils)/.test(getFunctionCode(FUNCTION_NAME)),
	},
	{
		name: "function uses hyphenated name",
		check: () => {
			const dirs = existsSync(getFunctionsDir())
				? readdirSync(getFunctionsDir())
				: [];
			const helloDir = dirs.find(
				(d) => d.includes("hello") && d.includes("world"),
			);
			return helloDir !== undefined && /^hello-world$/.test(helloDir);
		},
	},
	{
		name: "overall quality: demonstrates Edge Function best practices",
		check: () => {
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
			return signals.filter((r) => r.test(allCode)).length >= 6;
		},
	},
];
