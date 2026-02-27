import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates organizations table", () => {
	expect(
		/create\s+table[\s\S]*?organizations/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("creates memberships table", () => {
	expect(
		/create\s+table[\s\S]*?memberships/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("creates projects table", () => {
	expect(
		/create\s+table[\s\S]*?projects/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("enables RLS on all tables", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/alter\s+table[\s\S]*?organizations[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		) &&
			/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			) &&
			/alter\s+table[\s\S]*?projects[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			),
	).toBe(true);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
	).toBe(true);
});

test("org_id FK on projects", () => {
	expect(
		/org[anization_]*id[\s\S]*?references[\s\S]*?organizations/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("private schema created", () => {
	expect(
		/create\s+schema[\s\S]*?private/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("security_definer helper function", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/private\./.test(sql) &&
			/security\s+definer/.test(sql) &&
			/set\s+search_path\s*=\s*''/.test(sql),
	).toBe(true);
});

test("policies use (select auth.uid())", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	if (policyBlocks.length === 0) {
		expect(false).toBe(true);
		return;
	}
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

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("index on membership lookup columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	if (!/create\s+index/.test(sql)) {
		expect(false).toBe(true);
		return;
	}
	const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
	expect(
		indexBlocks.filter(
			(idx) =>
				idx.includes("user_id") ||
				idx.includes("org_id") ||
				idx.includes("organization_id"),
		).length >= 1,
	).toBe(true);
});

test("uses timestamptz", () => {
	const rawSql = getMigrationSQL().toLowerCase();
	const sql = rawSql.replace(/--[^\n]*/g, "");
	const hasPlainTimestamp = /\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("_at ")
	) {
		expect(hasPlainTimestamp.test(sql)).toBe(false);
	} else {
		expect(true).toBe(true);
	}
});

test("idempotent DDL", () => {
	expect(/if\s+not\s+exists/.test(getMigrationSQL().toLowerCase())).toBe(true);
});

test("stable or immutable on helper function", () => {
	expect(/\bstable\b|\bimmutable\b/.test(getMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("delete policy restricted to owner role", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const deletePolicy = policyBlocks.find(
		(p) =>
			p.toLowerCase().includes("delete") && p.toLowerCase().includes("project"),
	);
	if (!deletePolicy) {
		expect(false).toBe(true);
		return;
	}
	expect(/owner|admin/.test(deletePolicy.toLowerCase())).toBe(true);
});

test("overall quality score", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const signals = [
		/alter\s+table[\s\S]*?organizations[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		) &&
			/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			) &&
			/alter\s+table[\s\S]*?projects[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			),
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		/create\s+schema[\s\S]*?private/.test(sql),
		/security\s+definer/.test(sql) && /set\s+search_path\s*=\s*''/.test(sql),
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
		/create\s+index/.test(sql),
		!/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(
			sql.replace(/--[^\n]*/g, ""),
		),
		/if\s+not\s+exists/.test(sql),
		policyBlocks.some(
			(p) =>
				p.toLowerCase().includes("delete") &&
				p.toLowerCase().includes("project") &&
				/owner|admin/.test(p.toLowerCase()),
		),
		/org[anization_]*id[\s\S]*?references[\s\S]*?organizations/.test(sql),
		policyBlocks.length >= 3,
		/role/.test(sql),
		/private\./.test(sql),
		/\bstable\b|\bimmutable\b/.test(sql),
	];
	expect(signals.filter(Boolean).length >= 11).toBe(true);
});
