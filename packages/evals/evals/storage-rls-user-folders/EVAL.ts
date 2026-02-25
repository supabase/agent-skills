export const expectedReferenceFiles = [
	"storage-access-control.md",
	"db-rls-mandatory.md",
	"db-rls-common-mistakes.md",
	"db-rls-performance.md",
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
		name: "creates avatars bucket",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (
				!/storage\.buckets/.test(sql) ||
				!/avatars/.test(sql) ||
				!/public/.test(sql)
			)
				return false;
			const avatarsBlock = sql.match(
				/insert\s+into\s+storage\.buckets[\s\S]*?avatars[\s\S]*?;/,
			);
			return avatarsBlock !== null && /true/.test(avatarsBlock[0]);
		},
	},
	{
		name: "creates documents bucket",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (!/documents/.test(sql)) return false;
			const documentsBlock = sql.match(
				/insert\s+into\s+storage\.buckets[\s\S]*?documents[\s\S]*?;/,
			);
			return documentsBlock !== null && /false/.test(documentsBlock[0]);
		},
	},
	{
		name: "avatars bucket has mime type restriction",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/allowed_mime_types/.test(sql) &&
				/image\/jpeg/.test(sql) &&
				/image\/png/.test(sql) &&
				/image\/webp/.test(sql)
			);
		},
	},
	{
		name: "avatars bucket has file size limit",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (!/file_size_limit/.test(sql)) return false;
			return (
				/2097152/.test(sql) ||
				/2\s*m/i.test(sql) ||
				/2\s*\*\s*1024\s*\*\s*1024/.test(sql)
			);
		},
	},
	{
		name: "storage policy uses foldername or path for user isolation",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const usesFoldername = /storage\.foldername\s*\(\s*name\s*\)/.test(sql);
			const usesPathMatch =
				/\(\s*storage\.foldername\s*\(/.test(sql) ||
				/\bname\b.*auth\.uid\(\)/.test(sql);
			return (
				(usesFoldername || usesPathMatch) &&
				/auth\.uid\(\)\s*::\s*text/.test(sql)
			);
		},
	},
	{
		name: "storage policy uses TO authenticated",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const storagePolicies = policyBlocks.filter((p) =>
				p.toLowerCase().includes("storage.objects"),
			);
			const hasAuthenticatedPolicy = storagePolicies.some(
				(p) =>
					/to\s+(authenticated|public)/.test(p.toLowerCase()) ||
					/auth\.uid\(\)/.test(p.toLowerCase()),
			);
			if (!hasAuthenticatedPolicy) return false;
			const insertPolicies = storagePolicies.filter((p) =>
				/for\s+insert/.test(p.toLowerCase()),
			);
			return insertPolicies.every(
				(p) =>
					/to\s+authenticated/.test(p.toLowerCase()) ||
					/auth\.uid\(\)/.test(p.toLowerCase()),
			);
		},
	},
	{
		name: "public read policy for avatars",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const avatarSelectPolicies = policyBlocks.filter(
				(p) =>
					p.toLowerCase().includes("storage.objects") &&
					/for\s+select/.test(p.toLowerCase()) &&
					p.toLowerCase().includes("avatars"),
			);
			if (avatarSelectPolicies.length === 0) return false;
			return avatarSelectPolicies.some((p) => {
				const lower = p.toLowerCase();
				const hasExplicitPublic =
					/to\s+public/.test(lower) || /to\s+anon/.test(lower);
				const hasNoToClause = !/\bto\s+\w+/.test(lower);
				const hasNoAuthRestriction = !/auth\.uid\(\)/.test(lower);
				return hasExplicitPublic || (hasNoToClause && hasNoAuthRestriction);
			});
		},
	},
	{
		name: "documents bucket is fully private",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const documentPolicies = policyBlocks.filter(
				(p) =>
					p.toLowerCase().includes("storage.objects") &&
					p.toLowerCase().includes("documents"),
			);
			if (documentPolicies.length === 0) return false;
			return documentPolicies.every(
				(p) =>
					!/to\s+public/.test(p) &&
					!/to\s+anon/.test(p) &&
					(/to\s+authenticated/.test(p) || /auth\.uid\(\)/.test(p)),
			);
		},
	},
	{
		name: "creates file_metadata table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return /create\s+table/.test(sql) && /file_metadata/.test(sql);
		},
	},
	{
		name: "file_metadata has FK to auth.users with CASCADE",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/references\s+auth\.users/.test(sql) &&
				/on\s+delete\s+cascade/.test(sql)
			);
		},
	},
	{
		name: "RLS enabled on file_metadata",
		check: () =>
			/alter\s+table.*file_metadata.*enable\s+row\s+level\s+security/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "file_metadata policies use (select auth.uid())",
		check: () => {
			const sql = getMigrationSQL();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const metadataPolicies = policyBlocks.filter((p) =>
				p.toLowerCase().includes("file_metadata"),
			);
			for (const policy of metadataPolicies) {
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
		name: "uses timestamptz for time columns",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (
				!sql.includes("created_at") &&
				!sql.includes("updated_at") &&
				!sql.includes("uploaded_at")
			) {
				return true;
			}
			const columnDefs = sql.match(
				/(?:created_at|updated_at|uploaded_at)\s+timestamp\b/g,
			);
			if (!columnDefs) return true;
			return columnDefs.every((def) =>
				/timestamptz|timestamp\s+with\s+time\s+zone/.test(def),
			);
		},
	},
	{
		name: "index on file_metadata user_id",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/create\s+index/.test(sql) &&
				/file_metadata/.test(sql) &&
				/user_id/.test(sql)
			);
		},
	},
	{
		name: "idempotent DDL",
		check: () => /if\s+not\s+exists/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "overall quality score",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const signals = [
				/insert\s+into\s+storage\.buckets[\s\S]*?avatars/,
				/insert\s+into\s+storage\.buckets[\s\S]*?documents/,
				/allowed_mime_types/,
				/file_size_limit/,
				/storage\.foldername/,
				/auth\.uid\(\)\s*::\s*text/,
				/to\s+authenticated/,
				/to\s+(public|anon)/,
				/enable\s+row\s+level\s+security/,
				/on\s+delete\s+cascade/,
				/\(select\s+auth\.uid\(\)\)/,
				/create\s+index/,
				/timestamptz/,
				/if\s+not\s+exists/,
				/create\s+table[\s\S]*?file_metadata/,
			];
			return signals.filter((r) => r.test(sql)).length >= 11;
		},
	},
];
