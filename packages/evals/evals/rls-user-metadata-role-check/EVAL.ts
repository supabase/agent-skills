import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists in supabase/migrations/", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates documents table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/create\s+table/.test(sql) && /documents/.test(sql)).toBe(true);
});

test("RLS enabled on documents table", () => {
	expect(
		/alter\s+table.*documents.*enable\s+row\s+level\s+security/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("uses app_metadata not user_metadata for role check", () => {
	expect(/app_metadata/.test(getMigrationSQL().toLowerCase())).toBe(true);
});

test("user_metadata does not appear in policy USING clauses", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(policyBlocks.every((p) => !p.includes("user_metadata"))).toBe(true);
});

test("has at least two SELECT policies (owner and admin)", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const hasOwnerPolicy = policyBlocks.some(
		(p) =>
			(p.includes("select") || !p.includes("insert")) &&
			(p.includes("user_id") || p.includes("owner") || p.includes("auth.uid")),
	);
	const hasAdminPolicy = policyBlocks.some((p) => p.includes("app_metadata"));
	expect(hasOwnerPolicy && hasAdminPolicy).toBe(true);
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("uses (select auth.uid()) subselect form in policies", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	for (const policy of policyBlocks) {
		if (
			policy.includes("auth.uid()") &&
			!/\(\s*select\s+auth\.uid\(\)\s*\)/i.test(policy)
		) {
			expect(false).toBe(true);
			return;
		}
	}
	expect(true).toBe(true);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
	).toBe(true);
});

test("overall quality: demonstrates Supabase best practices", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const signals = [
		/alter\s+table.*documents.*enable\s+row\s+level\s+security/.test(sql),
		/app_metadata/.test(sql),
		policyBlocks.every((p) => !p.includes("user_metadata")),
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		policyBlocks.some(
			(p) =>
				p.includes("user_id") || p.includes("owner") || p.includes("auth.uid"),
		) && policyBlocks.some((p) => p.includes("app_metadata")),
	];
	expect(signals.filter(Boolean).length >= 5).toBe(true);
});
