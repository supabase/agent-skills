import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length).toBeGreaterThan(0);
});

test("creates organizations table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table[\s\S]*?organizations/);
});

test("creates memberships table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table[\s\S]*?memberships/);
});

test("creates projects table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table[\s\S]*?projects/);
});

test("enables RLS on all tables", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(
		/alter\s+table[\s\S]*?organizations[\s\S]*?enable\s+row\s+level\s+security/,
	);
	expect(sql).toMatch(
		/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/,
	);
	expect(sql).toMatch(
		/alter\s+table[\s\S]*?projects[\s\S]*?enable\s+row\s+level\s+security/,
	);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	// memberships should reference auth.users with cascade delete
	expect(sql).toMatch(/references\s+auth\.users/);
	expect(sql).toMatch(/on\s+delete\s+cascade/);
});

test("org_id FK on projects", () => {
	const sql = getMigrationSQL().toLowerCase();
	// projects should have a foreign key referencing organizations
	expect(sql).toMatch(
		/org[anization_]*id[\s\S]*?references[\s\S]*?organizations/,
	);
});

test("private schema created", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+schema[\s\S]*?private/);
});

test("security_definer helper function", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Function should be in the private schema with SECURITY DEFINER and search_path = ''
	expect(sql).toMatch(/private\./);
	expect(sql).toMatch(/security\s+definer/);
	expect(sql).toMatch(/set\s+search_path\s*=\s*''/);
});

test("policies use (select auth.uid())", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(policyBlocks.length).toBeGreaterThan(0);
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

test("index on membership lookup columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+index/);
	// Should index user_id and/or org_id on memberships for policy lookups
	const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
	const indexesUserOrOrg = indexBlocks.filter(
		(idx) =>
			idx.includes("user_id") ||
			idx.includes("org_id") ||
			idx.includes("organization_id"),
	);
	expect(indexesUserOrOrg.length).toBeGreaterThanOrEqual(1);
});

test("uses timestamptz", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Match "timestamp" that is NOT followed by "tz" or "with time zone"
	const hasPlainTimestamp = /\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	// Only fail if the migration defines time columns with plain timestamp
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("_at ")
	) {
		expect(sql).not.toMatch(hasPlainTimestamp);
	}
});

test("idempotent DDL", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/if\s+not\s+exists/);
});

test("delete policy restricted to owner role", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Look for a delete policy on projects that checks for owner (or admin) role
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const deletePolicy = policyBlocks.find(
		(p) =>
			p.toLowerCase().includes("delete") && p.toLowerCase().includes("project"),
	);
	expect(deletePolicy).toBeDefined();
	// The delete policy should check for an owner/admin role
	expect(deletePolicy?.toLowerCase()).toMatch(/owner|admin/);
});

test("overall quality score", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	// A high-quality migration should contain most of these best-practice signals
	const signals = [
		// 1. RLS enabled on all three tables
		/alter\s+table[\s\S]*?organizations[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		) &&
			/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			) &&
			/alter\s+table[\s\S]*?projects[\s\S]*?enable\s+row\s+level\s+security/.test(
				sql,
			),
		// 2. FK to auth.users with cascade
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		// 3. Private schema created
		/create\s+schema[\s\S]*?private/.test(sql),
		// 4. security_definer with search_path
		/security\s+definer/.test(sql) && /set\s+search_path\s*=\s*''/.test(sql),
		// 5. Subselect auth.uid()
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		// 6. TO authenticated on policies
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
		// 7. Indexes on lookup columns
		/create\s+index/.test(sql),
		// 8. timestamptz (no plain timestamp)
		!/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(sql),
		// 9. Idempotent DDL
		/if\s+not\s+exists/.test(sql),
		// 10. Delete policy checks owner role
		policyBlocks.some(
			(p) =>
				p.toLowerCase().includes("delete") &&
				p.toLowerCase().includes("project") &&
				/owner|admin/.test(p.toLowerCase()),
		),
		// 11. org_id FK on projects
		/org[anization_]*id[\s\S]*?references[\s\S]*?organizations/.test(sql),
		// 12. Multiple policies (at least one per table)
		policyBlocks.length >= 3,
		// 13. Membership role column exists
		/role/.test(sql),
		// 14. Private schema function referenced in policies
		/private\./.test(sql),
	];
	const passed = signals.filter(Boolean).length;
	expect(passed).toBeGreaterThanOrEqual(10);
});
