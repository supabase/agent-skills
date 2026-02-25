export const expectedReferenceFiles = [
	"db-rls-common-mistakes.md",
	"db-rls-policy-types.md",
	"db-rls-performance.md",
	"db-rls-mandatory.md",
	"db-schema-auth-fk.md",
];

import type { EvalAssertion } from "../../src/eval-types.js";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "migration file exists in supabase/migrations/",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "creates documents table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+table/.test(sql) && /documents/.test(sql);
		},
	},
	{
		name: "RLS enabled on documents table",
		check: () =>
			/alter\s+table.*documents.*enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "uses app_metadata not user_metadata for role check",
		check: () => /app_metadata/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "user_metadata does not appear in policy USING clauses",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			return policyBlocks.every((p) => !p.includes("user_metadata"));
		},
	},
	{
		name: "has at least two SELECT policies (owner and admin)",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const hasOwnerPolicy = policyBlocks.some(
				(p) =>
					(p.includes("select") || !p.includes("insert")) &&
					(p.includes("user_id") ||
						p.includes("owner") ||
						p.includes("auth.uid")),
			);
			const hasAdminPolicy = policyBlocks.some((p) =>
				p.includes("app_metadata"),
			);
			return hasOwnerPolicy && hasAdminPolicy;
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
		name: "uses (select auth.uid()) subselect form in policies",
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
				/alter\s+table.*documents.*enable\s+row\s+level\s+security/.test(sql),
				/app_metadata/.test(sql),
				policyBlocks.every((p) => !p.includes("user_metadata")),
				/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
				policyBlocks.length > 0 &&
					policyBlocks.every((p) => /to\s+authenticated/.test(p)),
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				policyBlocks.some(
					(p) =>
						p.includes("user_id") ||
						p.includes("owner") ||
						p.includes("auth.uid"),
				) && policyBlocks.some((p) => p.includes("app_metadata")),
			];
			return signals.filter(Boolean).length >= 5;
		},
	},
];
