export const expectedReferenceFiles = [
	"db-rls-mandatory.md",
	"db-rls-common-mistakes.md",
	"db-rls-performance.md",
	"db-security-functions.md",
	"db-schema-auth-fk.md",
	"db-schema-timestamps.md",
	"db-schema-realtime.md",
	"db-perf-indexes.md",
	"db-migrations-idempotent.md",
	"realtime-setup-auth.md",
	"realtime-broadcast-database.md",
	"realtime-setup-channels.md",
];

import type { EvalAssertion } from "../../src/eval-types.js";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

export const assertions: EvalAssertion[] = [
	{
		name: "migration file exists",
		check: () => findMigrationFiles().length > 0,
	},
	{
		name: "creates rooms table",
		check: () =>
			/create\s+table[\s\S]*?rooms/.test(getMigrationSQL().toLowerCase()),
	},
	{
		name: "creates room_members table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/create\s+table[\s\S]*?room_members/.test(sql) ||
				/create\s+table[\s\S]*?room_users/.test(sql) ||
				/create\s+table[\s\S]*?memberships/.test(sql)
			);
		},
	},
	{
		name: "creates content table",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/create\s+table[\s\S]*?content/.test(sql) ||
				/create\s+table[\s\S]*?items/.test(sql) ||
				/create\s+table[\s\S]*?documents/.test(sql) ||
				/create\s+table[\s\S]*?posts/.test(sql) ||
				/create\s+table[\s\S]*?messages/.test(sql)
			);
		},
	},
	{
		name: "room_members has role column with owner/editor/viewer",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/role/.test(sql) &&
				/owner/.test(sql) &&
				/editor/.test(sql) &&
				/viewer/.test(sql)
			);
		},
	},
	{
		name: "enables RLS on all application tables",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const roomsRls =
				/alter\s+table[\s\S]*?rooms[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				);
			const membershipRls =
				/alter\s+table[\s\S]*?room_members[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?room_users[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				);
			const contentRls =
				/alter\s+table[\s\S]*?content[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?items[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?documents[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?posts[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				) ||
				/alter\s+table[\s\S]*?messages[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				);
			return roomsRls && membershipRls && contentRls;
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
		name: "content has room_id FK referencing rooms",
		check: () =>
			/room_id[\s\S]*?references[\s\S]*?rooms/.test(
				getMigrationSQL().toLowerCase(),
			),
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
			const appPolicies = policyBlocks.filter(
				(p) => !p.includes("realtime.messages"),
			);
			return (
				appPolicies.length > 0 &&
				appPolicies.every((p) => /to\s+authenticated/.test(p))
			);
		},
	},
	{
		name: "private schema with security_definer helper function",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				/create\s+schema[\s\S]*?private/.test(sql) &&
				/private\./.test(sql) &&
				/security\s+definer/.test(sql) &&
				/set\s+search_path\s*=\s*''/.test(sql)
			);
		},
	},
	{
		name: "role-based write policies: content INSERT/UPDATE restricted to owner or editor",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const writePolicies = policyBlocks.filter(
				(p) =>
					(/for\s+(insert|update|all)/.test(p) || /insert|update/.test(p)) &&
					(p.includes("content") ||
						p.includes("items") ||
						p.includes("documents") ||
						p.includes("posts") ||
						p.includes("messages")),
			);
			return writePolicies.some(
				(p) => p.includes("owner") || p.includes("editor"),
			);
		},
	},
	{
		name: "viewer role is read-only (no write access to content)",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const contentWritePolicies = policyBlocks.filter(
				(p) =>
					/for\s+(insert|update|delete)/.test(p) &&
					(p.includes("content") ||
						p.includes("items") ||
						p.includes("documents") ||
						p.includes("posts") ||
						p.includes("messages")),
			);
			if (contentWritePolicies.length === 0) return true;
			return !contentWritePolicies.some((p) => {
				const mentionsRole =
					p.includes("owner") || p.includes("editor") || p.includes("viewer");
				if (!mentionsRole) return true;
				return (
					p.includes("viewer") && !p.includes("owner") && !p.includes("editor")
				);
			});
		},
	},
	{
		name: "indexes on membership lookup columns",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			if (!/create\s+index/.test(sql)) return false;
			const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
			return (
				indexBlocks.filter(
					(idx) =>
						idx.toLowerCase().includes("user_id") ||
						idx.toLowerCase().includes("room_id"),
				).length >= 1
			);
		},
	},
	{
		name: "uses timestamptz not plain timestamp",
		check: () => {
			const rawSql = getMigrationSQL().toLowerCase();
			const sql = rawSql.replace(/--[^\n]*/g, "");
			const hasPlainTimestamp =
				/(?:created_at|updated_at|invited_at|joined_at)\s+timestamp(?!\s*tz)(?!\s+with\s+time\s+zone)/;
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
		name: "realtime publication enabled for content table",
		check: () =>
			/alter\s+publication\s+supabase_realtime\s+add\s+table/.test(
				getMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "broadcast trigger for content changes",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			return (
				(/realtime\.broadcast_changes/.test(sql) ||
					/realtime\.send/.test(sql)) &&
				/create\s+trigger/.test(sql)
			);
		},
	},
	{
		name: "broadcast trigger function uses security definer",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const functionBlocks =
				sql.match(/create[\s\S]*?function[\s\S]*?\$\$[\s\S]*?\$\$/gi) ?? [];
			const realtimeFunctions = functionBlocks.filter(
				(f) =>
					f.toLowerCase().includes("realtime.broadcast_changes") ||
					f.toLowerCase().includes("realtime.send"),
			);
			if (realtimeFunctions.length === 0) return false;
			return realtimeFunctions.some(
				(f) =>
					/security\s+definer/.test(f.toLowerCase()) &&
					/set\s+search_path\s*=\s*''/.test(f.toLowerCase()),
			);
		},
	},
	{
		name: "RLS policies on realtime.messages",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const realtimePolicies = policyBlocks.filter((p) =>
				p.includes("realtime.messages"),
			);
			if (realtimePolicies.length === 0) return false;
			return realtimePolicies.some(
				(p) => /to\s+authenticated/.test(p) || /auth\.uid\(\)/.test(p),
			);
		},
	},
	{
		name: "realtime policy checks extension column",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const realtimePolicies = policyBlocks.filter((p) =>
				p.includes("realtime.messages"),
			);
			return realtimePolicies.some(
				(p) =>
					p.includes("extension") &&
					(p.includes("broadcast") || p.includes("presence")),
			);
		},
	},
	{
		name: "overall quality score",
		check: () => {
			const sql = getMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			const signals = [
				/alter\s+table[\s\S]*?rooms[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				),
				/alter\s+table[\s\S]*?(room_members|room_users|memberships)[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				),
				/alter\s+table[\s\S]*?(content|items|documents|posts|messages)[\s\S]*?enable\s+row\s+level\s+security/.test(
					sql,
				),
				/references\s+auth\.users/.test(sql) &&
					/on\s+delete\s+cascade/.test(sql),
				/create\s+schema[\s\S]*?private/.test(sql),
				/security\s+definer/.test(sql) &&
					/set\s+search_path\s*=\s*''/.test(sql),
				/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
				policyBlocks.length > 0 &&
					policyBlocks.filter((p) => !p.includes("realtime.messages")).length >
						0 &&
					policyBlocks
						.filter((p) => !p.includes("realtime.messages"))
						.every((p) => /to\s+authenticated/.test(p)),
				/create\s+index/.test(sql),
				/timestamptz/.test(sql) || /timestamp\s+with\s+time\s+zone/.test(sql),
				/if\s+not\s+exists/.test(sql),
				sql.includes("owner") &&
					sql.includes("editor") &&
					sql.includes("viewer"),
				/alter\s+publication\s+supabase_realtime\s+add\s+table/.test(sql),
				/realtime\.broadcast_changes/.test(sql) || /realtime\.send/.test(sql),
				/create\s+trigger/.test(sql),
				policyBlocks.some((p) => p.includes("realtime.messages")),
				policyBlocks
					.filter((p) => p.includes("realtime.messages"))
					.some((p) => p.includes("extension")),
				/room_id[\s\S]*?references[\s\S]*?rooms/.test(sql),
			];
			return signals.filter(Boolean).length >= 13;
		},
	},
];
