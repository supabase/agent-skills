import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "./eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates rooms table", () => {
	expect(
		/create\s+table[\s\S]*?rooms/.test(getMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("creates room_members table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/create\s+table[\s\S]*?room_members/.test(sql) ||
			/create\s+table[\s\S]*?room_users/.test(sql) ||
			/create\s+table[\s\S]*?memberships/.test(sql),
	).toBe(true);
});

test("creates content table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/create\s+table[\s\S]*?content/.test(sql) ||
			/create\s+table[\s\S]*?items/.test(sql) ||
			/create\s+table[\s\S]*?documents/.test(sql) ||
			/create\s+table[\s\S]*?posts/.test(sql) ||
			/create\s+table[\s\S]*?messages/.test(sql),
	).toBe(true);
});

test("room_members has role column with owner/editor/viewer", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/role/.test(sql) &&
			/owner/.test(sql) &&
			/editor/.test(sql) &&
			/viewer/.test(sql),
	).toBe(true);
});

test("enables RLS on all application tables", () => {
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
	expect(roomsRls && membershipRls && contentRls).toBe(true);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
	).toBe(true);
});

test("content has room_id FK referencing rooms", () => {
	expect(
		/room_id[\s\S]*?references[\s\S]*?rooms/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("policies use (select auth.uid())", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	if (policyBlocks.length === 0) {
		expect(false).toBe(true);
		return;
	}
	for (const policy of policyBlocks) {
		if (
			policy.includes("auth.uid()") &&
			!/\(\s*select\s+auth\.uid\(\)\s*\)/i.test(policy)
		) {
			expect(false).toBe(true);
			return;
		}
	}
	expect(true).toBe(true);
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const appPolicies = policyBlocks.filter(
		(p) => !p.includes("realtime.messages"),
	);
	expect(
		appPolicies.length > 0 &&
			appPolicies.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("private schema with security_definer helper function", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		/create\s+schema[\s\S]*?private/.test(sql) &&
			/private\./.test(sql) &&
			/security\s+definer/.test(sql) &&
			/set\s+search_path\s*=\s*''/.test(sql),
	).toBe(true);
});

test("role-based write policies: content INSERT/UPDATE restricted to owner or editor", () => {
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
	expect(
		writePolicies.some((p) => p.includes("owner") || p.includes("editor")),
	).toBe(true);
});

test("viewer role is read-only (no write access to content)", () => {
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
	if (contentWritePolicies.length === 0) {
		expect(true).toBe(true);
		return;
	}
	const result = !contentWritePolicies.some((p) => {
		const mentionsRole =
			p.includes("owner") || p.includes("editor") || p.includes("viewer");
		if (!mentionsRole) return true;
		return (
			p.includes("viewer") && !p.includes("owner") && !p.includes("editor")
		);
	});
	expect(result).toBe(true);
});

test("indexes on membership lookup columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	if (!/create\s+index/.test(sql)) {
		expect(false).toBe(true);
		return;
	}
	const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
	expect(
		indexBlocks.filter(
			(idx) =>
				idx.toLowerCase().includes("user_id") ||
				idx.toLowerCase().includes("room_id"),
		).length >= 1,
	).toBe(true);
});

test("uses timestamptz not plain timestamp", () => {
	const rawSql = getMigrationSQL().toLowerCase();
	const sql = rawSql.replace(/--[^\n]*/g, "");
	const hasPlainTimestamp =
		/(?:created_at|updated_at|invited_at|joined_at)\s+timestamp(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("_at ")
	) {
		expect(hasPlainTimestamp.test(sql)).toBe(false);
	} else {
		expect(true).toBe(true);
	}
});

test("idempotent DDL", () => {
	expect(/if\s+not\s+exists/.test(getMigrationSQL().toLowerCase())).toBe(true);
});

test("realtime publication enabled for content table", () => {
	expect(
		/alter\s+publication\s+supabase_realtime\s+add\s+table/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("broadcast trigger for content changes", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(
		(/realtime\.broadcast_changes/.test(sql) || /realtime\.send/.test(sql)) &&
			/create\s+trigger/.test(sql),
	).toBe(true);
});

test("broadcast trigger function uses security definer", () => {
	const sql = getMigrationSQL().toLowerCase();
	const functionBlocks =
		sql.match(/create[\s\S]*?function[\s\S]*?\$\$[\s\S]*?\$\$/gi) ?? [];
	const realtimeFunctions = functionBlocks.filter(
		(f) =>
			f.toLowerCase().includes("realtime.broadcast_changes") ||
			f.toLowerCase().includes("realtime.send"),
	);
	if (realtimeFunctions.length === 0) {
		expect(false).toBe(true);
		return;
	}
	expect(
		realtimeFunctions.some(
			(f) =>
				/security\s+definer/.test(f.toLowerCase()) &&
				/set\s+search_path\s*=\s*''/.test(f.toLowerCase()),
		),
	).toBe(true);
});

test("RLS policies on realtime.messages", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const realtimePolicies = policyBlocks.filter((p) =>
		p.includes("realtime.messages"),
	);
	if (realtimePolicies.length === 0) {
		expect(false).toBe(true);
		return;
	}
	expect(
		realtimePolicies.some(
			(p) => /to\s+authenticated/.test(p) || /auth\.uid\(\)/.test(p),
		),
	).toBe(true);
});

test("realtime policy checks extension column", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const realtimePolicies = policyBlocks.filter((p) =>
		p.includes("realtime.messages"),
	);
	expect(
		realtimePolicies.some(
			(p) =>
				p.includes("extension") &&
				(p.includes("broadcast") || p.includes("presence")),
		),
	).toBe(true);
});

test("overall quality score", () => {
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
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		/create\s+schema[\s\S]*?private/.test(sql),
		/security\s+definer/.test(sql) && /set\s+search_path\s*=\s*''/.test(sql),
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		policyBlocks.length > 0 &&
			policyBlocks.filter((p) => !p.includes("realtime.messages")).length > 0 &&
			policyBlocks
				.filter((p) => !p.includes("realtime.messages"))
				.every((p) => /to\s+authenticated/.test(p)),
		/create\s+index/.test(sql),
		/timestamptz/.test(sql) || /timestamp\s+with\s+time\s+zone/.test(sql),
		/if\s+not\s+exists/.test(sql),
		sql.includes("owner") && sql.includes("editor") && sql.includes("viewer"),
		/alter\s+publication\s+supabase_realtime\s+add\s+table/.test(sql),
		/realtime\.broadcast_changes/.test(sql) || /realtime\.send/.test(sql),
		/create\s+trigger/.test(sql),
		policyBlocks.some((p) => p.includes("realtime.messages")),
		policyBlocks
			.filter((p) => p.includes("realtime.messages"))
			.some((p) => p.includes("extension")),
		/room_id[\s\S]*?references[\s\S]*?rooms/.test(sql),
	];
	expect(signals.filter(Boolean).length >= 13).toBe(true);
});
