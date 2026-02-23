import { expect, test } from "vitest";

import { findMigrationFiles, getMigrationSQL } from "../eval-utils.ts";

test("migration file exists", () => {
	expect(findMigrationFiles().length).toBeGreaterThan(0);
});

test("creates rooms table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table[\s\S]*?rooms/);
});

test("creates room_members table", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Accept room_members, members, memberships, room_users, etc.
	const hasMembership =
		/create\s+table[\s\S]*?room_members/.test(sql) ||
		/create\s+table[\s\S]*?room_users/.test(sql) ||
		/create\s+table[\s\S]*?memberships/.test(sql);
	expect(hasMembership).toBe(true);
});

test("creates content table", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Accept content, contents, items, room_content, room_items, documents, etc.
	const hasContent =
		/create\s+table[\s\S]*?content/.test(sql) ||
		/create\s+table[\s\S]*?items/.test(sql) ||
		/create\s+table[\s\S]*?documents/.test(sql) ||
		/create\s+table[\s\S]*?posts/.test(sql) ||
		/create\s+table[\s\S]*?messages/.test(sql);
	expect(hasContent).toBe(true);
});

test("room_members has role column with owner/editor/viewer", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/role/);
	// Should define the three roles somewhere (enum, check constraint, or comment)
	expect(sql).toMatch(/owner/);
	expect(sql).toMatch(/editor/);
	expect(sql).toMatch(/viewer/);
});

test("enables RLS on all application tables", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Must enable RLS on rooms
	expect(sql).toMatch(
		/alter\s+table[\s\S]*?rooms[\s\S]*?enable\s+row\s+level\s+security/,
	);
	// Must enable RLS on membership table
	const hasMembershipRls =
		/alter\s+table[\s\S]*?room_members[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		) ||
		/alter\s+table[\s\S]*?room_users[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		) ||
		/alter\s+table[\s\S]*?memberships[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		);
	expect(hasMembershipRls).toBe(true);
	// Must enable RLS on content table (accept various names)
	const hasContentRls =
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
	expect(hasContentRls).toBe(true);
});

test("FK to auth.users with ON DELETE CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/references\s+auth\.users/);
	expect(sql).toMatch(/on\s+delete\s+cascade/);
});

test("content has room_id FK referencing rooms", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Content table should have a foreign key to rooms
	expect(sql).toMatch(/room_id[\s\S]*?references[\s\S]*?rooms/);
});

test("policies use (select auth.uid())", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(policyBlocks.length).toBeGreaterThan(0);
	for (const policy of policyBlocks) {
		if (policy.includes("auth.uid()")) {
			expect(policy).toMatch(/\(\s*select\s+auth\.uid\(\)\s*\)/i);
		}
	}
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	// Filter to only application table policies (not realtime.messages which may use different roles)
	const appPolicies = policyBlocks.filter(
		(p) => !p.includes("realtime.messages"),
	);
	expect(appPolicies.length).toBeGreaterThan(0);
	for (const policy of appPolicies) {
		expect(policy).toMatch(/to\s+authenticated/);
	}
});

test("private schema with security_definer helper function", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Private schema should be created
	expect(sql).toMatch(/create\s+schema[\s\S]*?private/);
	// A function in the private schema with SECURITY DEFINER
	expect(sql).toMatch(/private\./);
	expect(sql).toMatch(/security\s+definer/);
	expect(sql).toMatch(/set\s+search_path\s*=\s*''/);
});

test("role-based write policies: content INSERT/UPDATE restricted to owner or editor", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	// Find INSERT or UPDATE policies on the content table
	const writePolicies = policyBlocks.filter(
		(p) =>
			(/for\s+(insert|update|all)/.test(p) || /insert|update/.test(p)) &&
			(p.includes("content") ||
				p.includes("items") ||
				p.includes("documents") ||
				p.includes("posts") ||
				p.includes("messages")),
	);
	// At least one write policy should check for owner or editor role
	const checksRole = writePolicies.some(
		(p) => p.includes("owner") || p.includes("editor"),
	);
	expect(checksRole).toBe(true);
});

test("viewer role is read-only (no write access to content)", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	// Find content write policies (INSERT, UPDATE, DELETE)
	const contentWritePolicies = policyBlocks.filter(
		(p) =>
			/for\s+(insert|update|delete)/.test(p) &&
			(p.includes("content") ||
				p.includes("items") ||
				p.includes("documents") ||
				p.includes("posts") ||
				p.includes("messages")),
	);
	// None of the write policies should grant access to viewer role
	// They should either explicitly check for owner/editor OR exclude viewer
	if (contentWritePolicies.length > 0) {
		const anyGrantsViewer = contentWritePolicies.some((p) => {
			// If the policy doesn't mention any role, it's too permissive
			const mentionsRole =
				p.includes("owner") || p.includes("editor") || p.includes("viewer");
			if (!mentionsRole) return true; // no role check = viewer could write
			// If it specifically includes viewer in a write context, that's wrong
			return (
				p.includes("viewer") && !p.includes("owner") && !p.includes("editor")
			);
		});
		expect(anyGrantsViewer).toBe(false);
	}
});

test("indexes on membership lookup columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+index/);
	const indexBlocks = sql.match(/create\s+index[\s\S]*?;/gi) ?? [];
	// Should index user_id and/or room_id on the membership table
	const membershipIndexes = indexBlocks.filter(
		(idx) =>
			idx.toLowerCase().includes("user_id") ||
			idx.toLowerCase().includes("room_id"),
	);
	expect(membershipIndexes.length).toBeGreaterThanOrEqual(1);
});

test("uses timestamptz not plain timestamp", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Match "timestamp" that is NOT followed by "tz" or "with time zone"
	const hasPlainTimestamp =
		/(?:created_at|updated_at|invited_at|joined_at)\s+timestamp(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	// Only fail if the migration defines time columns with plain timestamp
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("_at ")
	) {
		expect(sql).not.toMatch(hasPlainTimestamp);
	}
});

test("idempotent DDL", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/if\s+not\s+exists/);
});

test("realtime publication enabled for content table", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should add the content table to supabase_realtime publication
	expect(sql).toMatch(/alter\s+publication\s+supabase_realtime\s+add\s+table/);
});

test("broadcast trigger for content changes", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should use realtime.broadcast_changes() or realtime.send() in a trigger
	const usesBroadcastChanges = /realtime\.broadcast_changes/.test(sql);
	const usesRealtimeSend = /realtime\.send/.test(sql);
	expect(usesBroadcastChanges || usesRealtimeSend).toBe(true);
	// Should create a trigger on the content table
	expect(sql).toMatch(/create\s+trigger/);
});

test("broadcast trigger function uses security definer", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Find function definitions that reference realtime.broadcast_changes or realtime.send
	const functionBlocks =
		sql.match(/create[\s\S]*?function[\s\S]*?\$\$[\s\S]*?\$\$/gi) ?? [];
	const realtimeFunctions = functionBlocks.filter(
		(f) =>
			f.toLowerCase().includes("realtime.broadcast_changes") ||
			f.toLowerCase().includes("realtime.send"),
	);
	expect(realtimeFunctions.length).toBeGreaterThan(0);
	// The trigger function should have security definer and search_path
	const hasSecurityDefiner = realtimeFunctions.some(
		(f) =>
			/security\s+definer/.test(f.toLowerCase()) &&
			/set\s+search_path\s*=\s*''/.test(f.toLowerCase()),
	);
	expect(hasSecurityDefiner).toBe(true);
});

test("RLS policies on realtime.messages", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const realtimePolicies = policyBlocks.filter((p) =>
		p.includes("realtime.messages"),
	);
	expect(realtimePolicies.length).toBeGreaterThan(0);
	// At least one policy should target authenticated users
	const hasAuthPolicy = realtimePolicies.some(
		(p) => /to\s+authenticated/.test(p) || /auth\.uid\(\)/.test(p),
	);
	expect(hasAuthPolicy).toBe(true);
});

test("realtime policy checks extension column", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const realtimePolicies = policyBlocks.filter((p) =>
		p.includes("realtime.messages"),
	);
	// At least one realtime policy should reference the extension column
	const checksExtension = realtimePolicies.some(
		(p) =>
			p.includes("extension") &&
			(p.includes("broadcast") || p.includes("presence")),
	);
	expect(checksExtension).toBe(true);
});

test("overall quality score", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];

	const signals = [
		// 1. RLS enabled on rooms
		/alter\s+table[\s\S]*?rooms[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		),
		// 2. RLS enabled on membership table
		/alter\s+table[\s\S]*?(room_members|room_users|memberships)[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		),
		// 3. RLS enabled on content table
		/alter\s+table[\s\S]*?(content|items|documents|posts|messages)[\s\S]*?enable\s+row\s+level\s+security/.test(
			sql,
		),
		// 4. FK to auth.users with cascade
		/references\s+auth\.users/.test(sql) && /on\s+delete\s+cascade/.test(sql),
		// 5. Private schema created
		/create\s+schema[\s\S]*?private/.test(sql),
		// 6. security_definer with search_path
		/security\s+definer/.test(sql) && /set\s+search_path\s*=\s*''/.test(sql),
		// 7. Subselect auth.uid()
		/\(\s*select\s+auth\.uid\(\)\s*\)/.test(sql),
		// 8. TO authenticated on policies
		policyBlocks.length > 0 &&
			policyBlocks.filter((p) => !p.includes("realtime.messages")).length > 0 &&
			policyBlocks
				.filter((p) => !p.includes("realtime.messages"))
				.every((p) => /to\s+authenticated/.test(p)),
		// 9. Indexes on lookup columns
		/create\s+index/.test(sql),
		// 10. timestamptz usage (accepts both timestamptz and timestamp with time zone)
		/timestamptz/.test(sql) || /timestamp\s+with\s+time\s+zone/.test(sql),
		// 11. IF NOT EXISTS for idempotency
		/if\s+not\s+exists/.test(sql),
		// 12. Role-based policies (owner/editor/viewer)
		sql.includes("owner") && sql.includes("editor") && sql.includes("viewer"),
		// 13. Realtime publication
		/alter\s+publication\s+supabase_realtime\s+add\s+table/.test(sql),
		// 14. Broadcast trigger (broadcast_changes or realtime.send)
		/realtime\.broadcast_changes/.test(sql) || /realtime\.send/.test(sql),
		// 15. Trigger creation
		/create\s+trigger/.test(sql),
		// 16. RLS on realtime.messages
		policyBlocks.some((p) => p.includes("realtime.messages")),
		// 17. Extension check in realtime policy
		policyBlocks
			.filter((p) => p.includes("realtime.messages"))
			.some((p) => p.includes("extension")),
		// 18. room_id FK on content
		/room_id[\s\S]*?references[\s\S]*?rooms/.test(sql),
	];
	const passed = signals.filter(Boolean).length;
	expect(passed).toBeGreaterThanOrEqual(13);
});
