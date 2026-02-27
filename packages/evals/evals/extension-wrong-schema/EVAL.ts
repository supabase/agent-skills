import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("extension installed in extensions schema", () => {
	expect(
		/create\s+extension[\s\S]*?with\s+schema\s+extensions/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("IF NOT EXISTS on extension creation", () => {
	expect(
		/create\s+extension\s+if\s+not\s+exists/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("vector column with correct dimensions", () => {
	expect(
		/(?:extensions\.)?vector\s*\(\s*1536\s*\)/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("HNSW index used instead of IVFFlat", () => {
	expect(/using\s+hnsw/.test(getMigrationSQL().toLowerCase())).toBe(true);
});

test("RLS enabled on documents table", () => {
	expect(
		/alter\s+table[\s\S]*?documents[\s\S]*?enable\s+row\s+level\s+security/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
	).toBe(true);
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("idempotent table creation (IF NOT EXISTS)", () => {
	expect(
		/create\s+table\s+if\s+not\s+exists/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("overall quality: demonstrates pgvector best practices", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const signals = [
		/create\s+extension[\s\S]*?with\s+schema\s+extensions/.test(sql),
		/create\s+extension\s+if\s+not\s+exists/.test(sql),
		/(?:extensions\.)?vector\s*\(\s*1536\s*\)/.test(sql),
		/using\s+hnsw/.test(sql),
		/alter\s+table[\s\S]*?documents[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		),
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
		/if\s+not\s+exists/.test(sql),
	];
	expect(signals.filter(Boolean).length >= 6).toBe(true);
});
