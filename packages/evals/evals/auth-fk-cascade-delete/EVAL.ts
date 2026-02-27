import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates profiles table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/create\s+table/.test(sql) && /profiles/.test(sql)).toBe(true);
});

test("FK references auth.users", () => {
	expect(/references\s+auth\.users/.test(getMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("ON DELETE CASCADE present", () => {
	expect(/on\s+delete\s+cascade/.test(getMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("RLS enabled on profiles", () => {
	expect(
		/alter\s+table.*profiles.*enable\s+row\s+level\s+security/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("trigger function uses SECURITY DEFINER", () => {
	expect(/security\s+definer/.test(getMigrationSQL().toLowerCase())).toBe(true);
});

test("trigger function sets search_path", () => {
	expect(
		/set\s+search_path\s*=\s*''/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("trigger created on auth.users", () => {
	expect(
		/create\s+trigger[\s\S]*?on\s+auth\.users/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("policies scoped to authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("overall quality: demonstrates Supabase best practices", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const signals = [
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		/alter\s+table.*profiles.*enable\s+row\s+level\s+security/.test(sql),
		/security\s+definer/.test(sql),
		/set\s+search_path\s*=\s*''/.test(sql),
		/create\s+trigger[\s\S]*?on\s+auth\.users/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	];
	expect(signals.filter(Boolean).length >= 5).toBe(true);
});
