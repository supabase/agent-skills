import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const supabaseDir = join(process.cwd(), "supabase");
const migrationsDir = join(supabaseDir, "migrations");

/** Find all .sql migration files (agent may create one or more). */
function findMigrationFiles(): string[] {
	if (!existsSync(migrationsDir)) return [];
	return readdirSync(migrationsDir)
		.filter((f) => f.endsWith(".sql"))
		.map((f) => join(migrationsDir, f));
}

/** Read and concatenate all migration SQL files. */
function getMigrationSQL(): string {
	const files = findMigrationFiles();
	if (files.length === 0)
		throw new Error("No migration file found in supabase/migrations/");
	return files.map((f) => readFileSync(f, "utf-8")).join("\n");
}

test("migration file exists", () => {
	expect(findMigrationFiles().length).toBeGreaterThan(0);
});

test("creates avatars bucket", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should insert into storage.buckets with id 'avatars' and public = true
	expect(sql).toMatch(/storage\.buckets/);
	expect(sql).toMatch(/avatars/);
	expect(sql).toMatch(/public/);
	// Verify it's marked as a public bucket (true)
	const avatarsBlock = sql.match(
		/insert\s+into\s+storage\.buckets[\s\S]*?avatars[\s\S]*?;/,
	);
	expect(avatarsBlock).not.toBeNull();
	if (avatarsBlock) {
		expect(avatarsBlock[0]).toMatch(/true/);
	}
});

test("creates documents bucket", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should insert into storage.buckets with id 'documents' and public = false
	expect(sql).toMatch(/documents/);
	const documentsBlock = sql.match(
		/insert\s+into\s+storage\.buckets[\s\S]*?documents[\s\S]*?;/,
	);
	expect(documentsBlock).not.toBeNull();
	if (documentsBlock) {
		expect(documentsBlock[0]).toMatch(/false/);
	}
});

test("avatars bucket has mime type restriction", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should have allowed_mime_types with image types
	expect(sql).toMatch(/allowed_mime_types/);
	// Check for image MIME types (jpeg, png, webp)
	expect(sql).toMatch(/image\/jpeg/);
	expect(sql).toMatch(/image\/png/);
	expect(sql).toMatch(/image\/webp/);
});

test("avatars bucket has file size limit", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should have file_size_limit set to approximately 2MB (2097152 bytes or 2MB string)
	expect(sql).toMatch(/file_size_limit/);
	// Accept either numeric bytes (2097152) or string form (2MB, 2MiB, 2 * 1024 * 1024)
	const hasNumericLimit = /2097152/.test(sql);
	const hasStringLimit = /2\s*m/i.test(sql);
	const hasCalcLimit = /2\s*\*\s*1024\s*\*\s*1024/.test(sql);
	expect(hasNumericLimit || hasStringLimit || hasCalcLimit).toBe(true);
});

test("storage policy uses foldername or path for user isolation", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Should use storage.foldername(name) with auth.uid()::text for folder isolation
	const usesFoldername = /storage\.foldername\s*\(\s*name\s*\)/.test(sql);
	// Also accept direct path matching patterns like (name ~ '^user-id/')
	const usesPathMatch =
		/\(\s*storage\.foldername\s*\(/.test(sql) ||
		/\bname\b.*auth\.uid\(\)/.test(sql);
	expect(usesFoldername || usesPathMatch).toBe(true);
	// Should cast auth.uid() to text for comparison with folder name
	expect(sql).toMatch(/auth\.uid\(\)\s*::\s*text/);
});

test("storage policy uses TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Storage upload/delete/update policies should target authenticated users.
	// Accepted forms:
	//   1. Explicit TO authenticated
	//   2. auth.uid() in USING/WITH CHECK (implicitly restricts to authenticated)
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const storagePolicies = policyBlocks.filter((p) =>
		p.toLowerCase().includes("storage.objects"),
	);
	// At least one storage policy should restrict to authenticated users
	const hasAuthenticatedPolicy = storagePolicies.some(
		(p) =>
			/to\s+(authenticated|public)/.test(p.toLowerCase()) ||
			/auth\.uid\(\)/.test(p.toLowerCase()),
	);
	expect(hasAuthenticatedPolicy).toBe(true);
	// Insert policies must restrict to authenticated users (explicit TO or auth.uid() check)
	const insertPolicies = storagePolicies.filter((p) =>
		/for\s+insert/.test(p.toLowerCase()),
	);
	for (const policy of insertPolicies) {
		const hasExplicitTo = /to\s+authenticated/.test(policy.toLowerCase());
		const hasAuthUidCheck = /auth\.uid\(\)/.test(policy.toLowerCase());
		expect(hasExplicitTo || hasAuthUidCheck).toBe(true);
	}
});

test("public read policy for avatars", () => {
	const sql = getMigrationSQL().toLowerCase();
	// A SELECT policy on storage.objects for avatars bucket should allow public/anon access.
	// Accepted forms:
	//   1. Explicit TO public / TO anon
	//   2. No TO clause (defaults to public role, granting all access)
	//   3. No auth.uid() restriction in USING (open to everyone)
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const avatarSelectPolicies = policyBlocks.filter(
		(p) =>
			p.toLowerCase().includes("storage.objects") &&
			/for\s+select/.test(p.toLowerCase()) &&
			p.toLowerCase().includes("avatars"),
	);
	expect(avatarSelectPolicies.length).toBeGreaterThan(0);
	// Should allow public access: explicit TO public/anon, or no TO clause without auth.uid() restriction
	const hasPublicAccess = avatarSelectPolicies.some((p) => {
		const lower = p.toLowerCase();
		const hasExplicitPublic =
			/to\s+public/.test(lower) || /to\s+anon/.test(lower);
		// No TO clause and no auth.uid() restriction means open to all
		const hasNoToClause = !/\bto\s+\w+/.test(lower);
		const hasNoAuthRestriction = !/auth\.uid\(\)/.test(lower);
		return hasExplicitPublic || (hasNoToClause && hasNoAuthRestriction);
	});
	expect(hasPublicAccess).toBe(true);
});

test("documents bucket is fully private", () => {
	const sql = getMigrationSQL().toLowerCase();
	// All policies for documents bucket should restrict to authenticated owner.
	// Accepted forms:
	//   1. Explicit TO authenticated
	//   2. auth.uid() in USING/WITH CHECK (implicitly restricts to authenticated)
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const documentPolicies = policyBlocks.filter(
		(p) =>
			p.toLowerCase().includes("storage.objects") &&
			p.toLowerCase().includes("documents"),
	);
	expect(documentPolicies.length).toBeGreaterThan(0);
	// None should allow public/anon access
	for (const policy of documentPolicies) {
		expect(policy).not.toMatch(/to\s+public/);
		expect(policy).not.toMatch(/to\s+anon/);
	}
	// All should be scoped to authenticated (explicit TO or auth.uid() check)
	for (const policy of documentPolicies) {
		const hasExplicitTo = /to\s+authenticated/.test(policy);
		const hasAuthUidCheck = /auth\.uid\(\)/.test(policy);
		expect(hasExplicitTo || hasAuthUidCheck).toBe(true);
	}
});

test("creates file_metadata table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+table/);
	expect(sql).toMatch(/file_metadata/);
});

test("file_metadata has FK to auth.users with CASCADE", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Find the file_metadata CREATE TABLE block or the surrounding context
	expect(sql).toMatch(/references\s+auth\.users/);
	expect(sql).toMatch(/on\s+delete\s+cascade/);
});

test("RLS enabled on file_metadata", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(
		/alter\s+table.*file_metadata.*enable\s+row\s+level\s+security/,
	);
});

test("file_metadata policies use (select auth.uid())", () => {
	const sql = getMigrationSQL();
	// Find policies that reference file_metadata
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const metadataPolicies = policyBlocks.filter((p) =>
		p.toLowerCase().includes("file_metadata"),
	);
	// Each policy that uses auth.uid() should use the subselect form
	for (const policy of metadataPolicies) {
		if (policy.includes("auth.uid()")) {
			expect(policy).toMatch(/\(\s*select\s+auth\.uid\(\)\s*\)/i);
		}
	}
});

test("uses timestamptz for time columns", () => {
	const sql = getMigrationSQL().toLowerCase();
	// Only check if the migration defines time-related columns
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("uploaded_at")
	) {
		// Check column definitions for plain "timestamp" (not timestamptz / timestamp with time zone).
		// Only match timestamp as a column type — look for column_name followed by timestamp.
		// Exclude matches inside trigger/function bodies and RETURNS TRIGGER.
		const columnDefs = sql.match(
			/(?:created_at|updated_at|uploaded_at)\s+timestamp\b/g,
		);
		if (columnDefs) {
			for (const def of columnDefs) {
				// Each match should use timestamptz or "timestamp with time zone"
				expect(def).toMatch(/timestamptz|timestamp\s+with\s+time\s+zone/);
			}
		}
	}
});

test("index on file_metadata user_id", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/create\s+index/);
	// Should index user_id on file_metadata
	expect(sql).toMatch(/file_metadata/);
	expect(sql).toMatch(/user_id/);
});

test("idempotent DDL", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(sql).toMatch(/if\s+not\s+exists/);
});

test("overall quality score", () => {
	const sql = getMigrationSQL().toLowerCase();
	// A high-quality migration should contain most of these best-practice signals
	const signals = [
		// 1. Avatars bucket is public
		/insert\s+into\s+storage\.buckets[\s\S]*?avatars/,
		// 2. Documents bucket exists
		/insert\s+into\s+storage\.buckets[\s\S]*?documents/,
		// 3. MIME type restriction
		/allowed_mime_types/,
		// 4. File size limit
		/file_size_limit/,
		// 5. Storage foldername helper
		/storage\.foldername/,
		// 6. auth.uid()::text cast
		/auth\.uid\(\)\s*::\s*text/,
		// 7. TO authenticated on policies
		/to\s+authenticated/,
		// 8. Public read for avatars
		/to\s+(public|anon)/,
		// 9. RLS on file_metadata
		/enable\s+row\s+level\s+security/,
		// 10. FK to auth.users with cascade
		/on\s+delete\s+cascade/,
		// 11. (select auth.uid()) subselect form
		/\(select\s+auth\.uid\(\)\)/,
		// 12. Index on user_id
		/create\s+index/,
		// 13. timestamptz usage
		/timestamptz/,
		// 14. IF NOT EXISTS for idempotency
		/if\s+not\s+exists/,
		// 15. file_metadata table
		/create\s+table[\s\S]*?file_metadata/,
	];
	const matches = signals.filter((r) => r.test(sql));
	// Require at least 11 of 15 best-practice signals
	expect(matches.length).toBeGreaterThanOrEqual(11);
});
