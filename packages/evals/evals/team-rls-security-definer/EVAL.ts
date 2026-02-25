export const expectedReferenceFiles = [
	"db-rls-mandatory.md",
	"db-rls-policy-types.md",
	"db-rls-common-mistakes.md",
	"db-rls-performance.md",
	"db-security-functions.md",
	"db-schema-auth-fk.md",
	"db-schema-timestamps.md",
	"db-perf-indexes.md",
	"db-migrations-idempotent.md",
];

import type { EvalAssertion } from "../../src/eval-types.js";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "migration file exists",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "creates organizations table",
		check: () =>
			/create\s+table[\s\S]*?organizations/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "creates memberships table",
		check: () =>
			/create\s+table[\s\S]*?memberships/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "creates projects table",
		check: () =>
			/create\s+table[\s\S]*?projects/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "enables RLS on all tables",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/alter\s+table[\s\S]*?organizations[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) &&
				/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) &&
				/alter\s+table[\s\S]*?projects[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				)
			);
		},
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
		name: "org_id FK on projects",
		check: () =>
			/org[anization_]*id[\s\S]*?references[\s\S]*?organizations/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "private schema created",
		check: () =>
			/create\s+schema[\s\S]*?private/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "security_definer helper function",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/private\./.test(sql) &&
				/security\s+definer/.test(sql) &&
				/set\s+search_path\s*=\s*''/.test(sql)
			);
		},
	},
	{
		name: "policies use (select auth.uid())",
		check: () => {
			const sql = getMigrationSQL();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			if (policyBlocks.length === 0) return false;
			for (const policy of policyBlocks) {
				if (
					policy.includes("auth.uid()") &&
					!/\(\s*select\s+auth\.uid\(\)\s*\)/i.test(policy)
				) {
					return false;
				}
			}
			return true;
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
		name: "index on membership lookup columns",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (!/create\s+index/.test(sql)) return false;
			const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
			return (
				indexBlocks.filter(
					(idx) =>
						idx.includes("user_id") ||
						idx.includes("org_id") ||
						idx.includes("organization_id"),
				).length >= 1
			);
		},
	},
	{
		name: "uses timestamptz",
		check: () => {
			const rawSql = getMigrationSQL().toLowerCase();
			const sql = rawSql.replace(/--[^\n]*/g, "");
			const hasPlainTimestamp =
				/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
			if (
				sql.includes("created_at") ||
				sql.includes("updated_at") ||
				sql.includes("_at ")
			) {
				return !hasPlainTimestamp.test(sql);
			}
			return true;
		},
	},
	{
		name: "idempotent DDL",
		check: () => /if\s+not\s+exists/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "stable or immutable on helper function",
		check: () =>
			/\bstable\b|\bimmutable\b/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "delete policy restricted to owner role",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const deletePolicy = policyBlocks.find(
				(p) =>
					p.toLowerCase().includes("delete") &&
					p.toLowerCase().includes("project"),
			);
			if (!deletePolicy) return false;
			return /owner|admin/.test(deletePolicy.toLowerCase());
		},
	},
	{
		name: "overall quality score",
		check: () => {
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
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				/create\s+schema[\s\S]*?private/.test(sql),
				/security\s+definer/.test(sql) &&
					/set\s+search_path\s*=\s*''/.test(sql),
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
			return signals.filter(Boolean).length >= 11;
		},
	},
];
