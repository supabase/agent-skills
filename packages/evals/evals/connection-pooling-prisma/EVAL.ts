import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const cwd = process.cwd();

function findPrismaSchema(): string | null {
	const candidates = [
		join(cwd, "prisma", "schema.prisma"),
		join(cwd, "schema.prisma"),
	];
	for (const p of candidates) {
		if (existsSync(p)) return p;
	}
	const prismaDir = join(cwd, "prisma");
	if (existsSync(prismaDir)) {
		const files = readdirSync(prismaDir).filter((f) => f.endsWith(".prisma"));
		if (files.length > 0) return join(prismaDir, files[0]);
	}
	return null;
}

function getPrismaSchema(): string {
	const file = findPrismaSchema();
	if (!file) throw new Error("No .prisma schema file found");
	return readFileSync(file, "utf-8");
}

function findEnvFiles(): string[] {
	const found: string[] = [];
	for (const name of [
		".env",
		".env.example",
		".env.local",
		".env.production",
		".env.development",
	]) {
		const p = join(cwd, name);
		if (existsSync(p)) found.push(p);
	}
	return found;
}

function getAllEnvContent(): string {
	return findEnvFiles()
		.map((f) => readFileSync(f, "utf-8"))
		.join("\n");
}

function getAllOutputContent(): string {
	const parts: string[] = [];
	const schema = findPrismaSchema();
	if (schema) parts.push(readFileSync(schema, "utf-8"));
	parts.push(getAllEnvContent());
	const mdFiles = readdirSync(cwd).filter((f) => f.endsWith(".md"));
	for (const f of mdFiles) {
		parts.push(readFileSync(join(cwd, f), "utf-8"));
	}
	return parts.join("\n");
}

test("prisma schema file exists", () => {
	expect(findPrismaSchema() !== null).toBe(true);
});

test("prisma schema references pooler port 6543", () => {
	expect(/6543/.test(getAllOutputContent())).toBe(true);
});

test("pgbouncer=true param present", () => {
	expect(/pgbouncer\s*=\s*true/.test(getAllOutputContent().toLowerCase())).toBe(
		true,
	);
});

test("DIRECT_URL provided for migrations", () => {
	const allContent = `${getPrismaSchema().toLowerCase()}\n${getAllEnvContent().toLowerCase()}`;
	expect(/directurl/.test(allContent) || /direct_url/.test(allContent)).toBe(
		true,
	);
});

test("datasource block references directUrl or DIRECT_URL env var", () => {
	const schema = getPrismaSchema().toLowerCase();
	const datasourceBlock =
		schema.match(/datasource\s+\w+\s*\{[\s\S]*?\}/)?.[0] ?? "";
	expect(
		/directurl/.test(datasourceBlock) || /direct_url/.test(datasourceBlock),
	).toBe(true);
});

test("connection limit set to 1 for serverless", () => {
	const content = getAllOutputContent().toLowerCase();
	expect(
		/connection_limit\s*=\s*1/.test(content) ||
			/connection_limit:\s*1/.test(content) ||
			/connectionlimit\s*=\s*1/.test(content),
	).toBe(true);
});

test("explanation distinguishes port 6543 vs 5432", () => {
	const content = getAllOutputContent();
	expect(/6543/.test(content) && /5432/.test(content)).toBe(true);
});

test("overall quality: demonstrates correct Prisma + Supabase pooler setup", () => {
	const schema = getPrismaSchema().toLowerCase();
	const envContent = getAllEnvContent().toLowerCase();
	const allContent = `${schema}\n${envContent}`;
	const signals = [
		/6543/,
		/pgbouncer\s*=\s*true/,
		/directurl|direct_url/,
		/connection_limit\s*=\s*1|connection_limit:\s*1/,
		/5432/,
	];
	expect(signals.filter((r) => r.test(allContent)).length >= 4).toBe(true);
});
