export const expectedReferenceFiles = [
	"db-schema-auth-fk.md",
	"db-security-functions.md",
	"db-rls-mandatory.md",
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
		name: "creates profiles table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+table/.test(sql) && /profiles/.test(sql);
		},
	},
	{
		name: "FK references auth.users",
		check: () =>
			/references\s+auth\.users/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "ON DELETE CASCADE present",
		check: () => /on\s+delete\s+cascade/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "RLS enabled on profiles",
		check: () =>
			/alter\s+table.*profiles.*enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "trigger function uses SECURITY DEFINER",
		check: () => /security\s+definer/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "trigger function sets search_path",
		check: () =>
			/set\s+search_path\s*=\s*''/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "trigger created on auth.users",
		check: () =>
			/create\s+trigger[\s\S]*?on\s+auth\.users/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "policies scoped to authenticated",
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
		name: "overall quality: demonstrates Supabase best practices",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const signals = [
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				/alter\s+table.*profiles.*enable\s+row\s+level\s+security/.test(sql),
				/security\s+definer/.test(sql),
				/set\s+search_path\s*=\s*''/.test(sql),
				/create\s+trigger[\s\S]*?on\s+auth\.users/.test(sql),
				policyBlocks.length > 0 &&
					policyBlocks.every((p) => /to\s+authenticated/.test(p)),
			];
			return signals.filter(Boolean).length >= 5;
		},
	},
];
