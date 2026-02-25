export const expectedReferenceFiles = [
	"db-rls-common-mistakes.md",
	"db-rls-policy-types.md",
	"db-rls-performance.md",
	"db-rls-mandatory.md",
	"db-schema-timestamps.md",
];

import type { EvalAssertion } from "../../src/eval-types.js";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "migration file exists",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "creates orders table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+table/.test(sql) && /orders/.test(sql);
		},
	},
	{
		name: "enables RLS on orders table",
		check: () =>
			/alter\s+table.*orders.*enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "has SELECT policy on orders",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			return policyBlocks.some((p) => p.includes("for select"));
		},
	},
	{
		name: "has UPDATE policy with WITH CHECK on orders",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const updatePolicy = policyBlocks.find((p) => p.includes("for update"));
			return updatePolicy !== undefined && /with\s+check/.test(updatePolicy);
		},
	},
	{
		name: "all policies use TO authenticated",
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
		name: "uses (select auth.uid()) not bare auth.uid() in policies",
		check: () => {
			const sql = getMigrationSQL();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
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
		name: "uses timestamptz not plain timestamp for created_at",
		check: () => {
			const rawSql = getMigrationSQL().toLowerCase();
			const sql = rawSql.replace(/--[^\n]*/g, "");
			const hasPlainTimestamp =
				/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
			if (sql.includes("created_at")) {
				return !hasPlainTimestamp.test(sql);
			}
			return true;
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
		name: "overall quality: demonstrates Supabase best practices",
		check: () => {
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
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				!/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(
					sql.replace(/--[^\n]*/g, ""),
				),
			];
			return signals.filter(Boolean).length >= 5;
		},
	},
];
