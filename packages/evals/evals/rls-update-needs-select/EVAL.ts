import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates orders table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/create\s+table/.test(sql) && /orders/.test(sql)).toBe(true);
});

test("enables RLS on orders table", () => {
	expect(
		/alter\s+table.*orders.*enable\s+row\s+level\s+security/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("has SELECT policy on orders", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(policyBlocks.some((p) => p.includes("for select"))).toBe(true);
});

test("has UPDATE policy with WITH CHECK on orders", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const updatePolicy = policyBlocks.find((p) => p.includes("for update"));
	expect(updatePolicy !== undefined && /with\s+check/.test(updatePolicy)).toBe(
		true,
	);
});

test("all policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("uses (select auth.uid()) not bare auth.uid() in policies", () => {
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

test("uses timestamptz not plain timestamp for created_at", () => {
	const rawSql = getMigrationSQL().toLowerCase();
	const sql = rawSql.replace(/--[^\n]*/g, "");
	const hasPlainTimestamp = /\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	if (sql.includes("created_at")) {
		expect(hasPlainTimestamp.test(sql)).toBe(false);
	} else {
		expect(true).toBe(true);
	}
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
		/alter\s+table.*orders.*enable\s+row\s+level\s+security/.test(sql),
		policyBlocks.some((p) => p.includes("for select")),
		policyBlocks.some(
			(p) => p.includes("for update") && /with\s+check/.test(p),
		),
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		!/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(
			sql.replace(/--[^\n]*/g, ""),
		),
	];
	expect(signals.filter(Boolean).length >= 5).toBe(true);
});
