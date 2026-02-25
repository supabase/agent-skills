export const expectedReferenceFiles = [
	"db-schema-extensions.md",
	"db-rls-mandatory.md",
	"db-migrations-idempotent.md",
	"db-schema-auth-fk.md",
	"db-rls-common-mistakes.md",
];

import type { EvalAssertion } from "../../src/eval-types.js";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "migration file exists",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "extension installed in extensions schema",
		check: () =>
			/create\s+extension[\s\S]*?with\s+schema\s+extensions/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "IF NOT EXISTS on extension creation",
		check: () =>
			/create\s+extension\s+if\s+not\s+exists/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "vector column with correct dimensions",
		check: () =>
			/(?:extensions\.)?vector\s*\(\s*1536\s*\)/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "HNSW index used instead of IVFFlat",
		check: () => /using\s+hnsw/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "RLS enabled on documents table",
		check: () =>
			/alter\s+table[\s\S]*?documents[\s\S]*?enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "FK to auth.users with ON DELETE CASCADE",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/references\s+auth\.users/.test(sql) &&
				/on\s+delete\s+cascade/.test(sql)
			);
		},
	},
	{
		name: "policies use TO authenticated",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			return (
				policyBlocks.length > 0 &&
				policyBlocks.every((p) => /to\s+authenticated/.test(p))
			);
		},
	},
	{
		name: "idempotent table creation (IF NOT EXISTS)",
		check: () =>
			/create\s+table\s+if\s+not\s+exists/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "overall quality: demonstrates pgvector best practices",
		check: () => {
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
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				policyBlocks.length > 0 &&
					policyBlocks.every((p) => /to\s+authenticated/.test(p)),
				/if\s+not\s+exists/.test(sql),
			];
			return signals.filter(Boolean).length >= 6;
		},
	},
];
