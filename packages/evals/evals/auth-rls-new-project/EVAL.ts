import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
	findMigrationFiles,
	getMigrationSQL,
	supabaseDir,
} from "../eval-utils.ts";

test("supabase project initialized (config.toml exists)", () => {
	expect(existsSync(join(supabaseDir, "config.toml"))).toBe(true);
});

test("migration file exists in supabase/migrations/", () => {
	expect(findMigrationFiles().length).toBeGreaterThan(0);
});

test("creates tasks table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table/);
	expect(sql).toMatch(/tasks/);
});

test("enables RLS on tasks table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/alter\s+table.*tasks.*enable\s+row\s+level\s+security/);
});

test("has foreign key to auth.users", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/references\s+auth\.users/);
});

test("uses ON DELETE CASCADE for auth FK", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/on\s+delete\s+cascade/);
});

test("uses (select auth.uid()) not bare auth.uid() in policies", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	for (const policy of policyBlocks) {
		if (policy.includes("auth.uid()")) {
			// The subselect form: (select auth.uid())
			expect(policy).toMatch(/\(\s*select\s+auth\.uid\(\)\s*\)/i);
		}
	}
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(policyBlocks.length).toBeGreaterThan(0);
	for (const policy of policyBlocks) {
		expect(policy).toMatch(/to\s+authenticated/);
	}
});

test("uses timestamptz not plain timestamp for time columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Match "timestamp" that is NOT followed by "tz" or "with time zone"
	const hasPlainTimestamp = /\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	// Only fail if the migration defines time columns with plain timestamp
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("due_date")
	) {
		expect(sql).not.toMatch(hasPlainTimestamp);
	}
});

test("creates index on user_id column", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+index/);
	expect(sql).toMatch(/user_id/);
});

test("migration is idempotent (uses IF NOT EXISTS)", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/if\s+not\s+exists/);
});

test("overall quality: demonstrates Supabase best practices", () => {
	const sql = getMigrationSQL().toLowerCase();
	// A high-quality migration should contain most of these patterns
	const signals = [
		/enable\s+row\s+level\s+security/,
		/\(select\s+auth\.uid\(\)\)/,
		/to\s+authenticated/,
		/on\s+delete\s+cascade/,
		/create\s+index/,
	];
	const matches = signals.filter((r) => r.test(sql));
	expect(matches.length).toBeGreaterThanOrEqual(4);
});
