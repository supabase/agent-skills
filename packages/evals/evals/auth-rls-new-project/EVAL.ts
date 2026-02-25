export const expectedReferenceFiles = [
	"dev-getting-started.md",
	"db-rls-mandatory.md",
	"db-rls-policy-types.md",
	"db-rls-common-mistakes.md",
	"db-schema-auth-fk.md",
	"db-schema-timestamps.md",
	"db-migrations-idempotent.md",
];

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EvalAssertion } from "../../src/eval-types.js";

import {
	anonSeeesNoRows,
	findMigrationFiles,
	getMigrationSQL,
	getSupabaseDir,
	queryTable,
	tableExists,
} from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "supabase project initialized (config.toml exists)",
		check: () => existsSync(join(getSupabaseDir(), "config.toml")),
	},
	{
		name: "migration file exists in supabase/migrations/",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "creates tasks table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+table/.test(sql) && /tasks/.test(sql);
		},
	},
	{
		name: "enables RLS on tasks table",
		check: () =>
			/alter\s+table.*tasks.*enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "has foreign key to auth.users",
		check: () =>
			/references\s+auth\.users/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "uses ON DELETE CASCADE for auth FK",
		check: () => /on\s+delete\s+cascade/.test(getMigrationSQL().toLowerCase()),
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
		name: "uses timestamptz not plain timestamp for time columns",
		check: () => {
			const rawSql = getMigrationSQL().toLowerCase();
			const sql = rawSql.replace(/--[^\n]*/g, "");
			const hasPlainTimestamp =
				/\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
			if (
				sql.includes("created_at") ||
				sql.includes("updated_at") ||
				sql.includes("due_date")
			) {
				return !hasPlainTimestamp.test(sql);
			}
			return true;
		},
	},
	{
		name: "creates index on user_id column",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+index/.test(sql) && /user_id/.test(sql);
		},
	},
	{
		name: "does not use SERIAL or BIGSERIAL for primary key",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return !/\bserial\b/.test(sql) && !/\bbigserial\b/.test(sql);
		},
	},
	{
		name: "migration is idempotent (uses IF NOT EXISTS)",
		check: () => /if\s+not\s+exists/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "overall quality: demonstrates Supabase best practices",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const signals = [
				/enable\s+row\s+level\s+security/,
				/\(select\s+auth\.uid\(\)\)/,
				/to\s+authenticated/,
				/on\s+delete\s+cascade/,
				/create\s+index/,
			];
			return signals.filter((r) => r.test(sql)).length >= 4;
		},
	},
	{
		name: "tasks table exists in the database after migration",
		check: () => tableExists("tasks"),
		timeout: 10_000,
	},
	{
		name: "tasks table is queryable with service role",
		check: async () => {
			const { error } = await queryTable("tasks", "service_role");
			return error === null;
		},
		timeout: 10_000,
	},
	{
		name: "tasks table returns no rows for anon (RLS is active)",
		check: () => anonSeeesNoRows("tasks"),
		timeout: 10_000,
	},
];
