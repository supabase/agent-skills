import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, basename } from "path";
import { parseRuleFile } from "./parser.js";
import { validateRuleFile } from "./validate.js";
import { RULES_DIR, AGENTS_OUTPUT, METADATA_FILE } from "./config.js";
import type { Rule, Metadata, Section } from "./types.js";

/**
 * Parse section definitions from _sections.md
 */
function parseSections(): Section[] {
  const sectionsFile = join(RULES_DIR, "_sections.md");
  if (!existsSync(sectionsFile)) {
    console.warn("Warning: _sections.md not found, using default sections");
    return getDefaultSections();
  }

  const content = readFileSync(sectionsFile, "utf-8");
  const sections: Section[] = [];

  const sectionMatches = content.matchAll(
    /##\s+(\d+)\.\s+([^\n(]+)\s*\((\w+)\)\s*\n\*\*Impact:\*\*\s*(\w+(?:-\w+)?)\s*\n\*\*Description:\*\*\s*([^\n]+)/g
  );

  for (const match of sectionMatches) {
    sections.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      prefix: match[3].trim(),
      impact: match[4].trim() as Section["impact"],
      description: match[5].trim(),
    });
  }

  return sections.length > 0 ? sections : getDefaultSections();
}

/**
 * Default sections if _sections.md is missing or unparseable
 */
function getDefaultSections(): Section[] {
  return [
    { number: 1, title: "Query Performance", prefix: "query", impact: "CRITICAL", description: "Slow queries, missing indexes, inefficient plans" },
    { number: 2, title: "Connection Management", prefix: "conn", impact: "CRITICAL", description: "Pooling, limits, serverless strategies" },
    { number: 3, title: "Schema Design", prefix: "schema", impact: "HIGH", description: "Table design, indexes, partitioning, data types" },
    { number: 4, title: "Concurrency & Locking", prefix: "lock", impact: "MEDIUM-HIGH", description: "Transactions, isolation, deadlocks" },
    { number: 5, title: "Security & RLS", prefix: "security", impact: "MEDIUM-HIGH", description: "Row-Level Security, privileges, auth patterns" },
    { number: 6, title: "Data Access Patterns", prefix: "data", impact: "MEDIUM", description: "N+1 queries, batch operations, pagination" },
    { number: 7, title: "Monitoring & Diagnostics", prefix: "monitor", impact: "LOW-MEDIUM", description: "pg_stat_statements, EXPLAIN, metrics" },
    { number: 8, title: "Advanced Features", prefix: "advanced", impact: "LOW", description: "Full-text search, JSONB, extensions" },
  ];
}

/**
 * Load metadata from metadata.json
 */
function loadMetadata(): Metadata {
  if (!existsSync(METADATA_FILE)) {
    return {
      version: "1.0.0",
      organization: "Supabase",
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      abstract: "Postgres performance optimization guide for developers.",
      references: [],
    };
  }

  return JSON.parse(readFileSync(METADATA_FILE, "utf-8"));
}

/**
 * Generate anchor from title
 */
function toAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Build AGENTS.md from all rule files
 */
function buildAgents(): void {
  console.log("Building AGENTS.md...\n");

  // Load metadata and sections
  const metadata = loadMetadata();
  const sections = parseSections();

  // Get all rule files
  const ruleFiles = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => join(RULES_DIR, f));

  if (ruleFiles.length === 0) {
    console.log("No rule files found. Generating empty AGENTS.md template.");
  }

  // Parse and validate all rules
  const rules: Rule[] = [];

  for (const file of ruleFiles) {
    const validation = validateRuleFile(file);
    if (!validation.valid) {
      console.error(`Skipping invalid file ${basename(file)}:`);
      validation.errors.forEach((e) => console.error(`  - ${e}`));
      continue;
    }

    const result = parseRuleFile(file);
    if (result.success && result.rule) {
      rules.push(result.rule);
    }
  }

  // Group rules by section and assign IDs
  const rulesBySection = new Map<number, Rule[]>();

  for (const rule of rules) {
    const sectionRules = rulesBySection.get(rule.section) || [];
    sectionRules.push(rule);
    rulesBySection.set(rule.section, sectionRules);
  }

  // Sort rules within each section and assign IDs
  for (const [sectionNum, sectionRules] of rulesBySection) {
    sectionRules.sort((a, b) => a.title.localeCompare(b.title));
    sectionRules.forEach((rule, index) => {
      rule.id = `${sectionNum}.${index + 1}`;
    });
  }

  // Generate markdown output
  const output: string[] = [];

  // Header
  output.push("# Postgres Best Practices\n");
  output.push(`**Version ${metadata.version}**`);
  output.push(`${metadata.organization}`);
  output.push(`${metadata.date}\n`);
  output.push("> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.\n");
  output.push("---\n");

  // Abstract
  output.push("## Abstract\n");
  output.push(`${metadata.abstract}\n`);
  output.push("---\n");

  // Table of Contents
  output.push("## Table of Contents\n");

  for (const section of sections) {
    const sectionRules = rulesBySection.get(section.number) || [];
    output.push(`${section.number}. [${section.title}](#${toAnchor(section.title)}) - **${section.impact}**`);

    for (const rule of sectionRules) {
      output.push(`   - ${rule.id} [${rule.title}](#${toAnchor(rule.id + "-" + rule.title)})`);
    }

    output.push("");
  }

  output.push("---\n");

  // Sections and Rules
  for (const section of sections) {
    const sectionRules = rulesBySection.get(section.number) || [];

    output.push(`## ${section.number}. ${section.title}\n`);
    output.push(`**Impact: ${section.impact}**\n`);
    output.push(`${section.description}\n`);

    if (sectionRules.length === 0) {
      output.push("*No rules defined yet. See rules/_template.md for creating new rules.*\n");
    }

    for (const rule of sectionRules) {
      output.push(`### ${rule.id} ${rule.title}\n`);

      if (rule.impactDescription) {
        output.push(`**Impact: ${rule.impact} (${rule.impactDescription})**\n`);
      } else {
        output.push(`**Impact: ${rule.impact}**\n`);
      }

      output.push(`${rule.explanation}\n`);

      for (const example of rule.examples) {
        if (example.description) {
          output.push(`**${example.label} (${example.description}):**\n`);
        } else {
          output.push(`**${example.label}:**\n`);
        }

        output.push("```" + (example.language || "sql"));
        output.push(example.code);
        output.push("```\n");

        if (example.additionalText) {
          output.push(`${example.additionalText}\n`);
        }
      }

      if (rule.supabaseNotes) {
        output.push(`**Supabase Note:** ${rule.supabaseNotes}\n`);
      }

      if (rule.references && rule.references.length > 0) {
        if (rule.references.length === 1) {
          output.push(`Reference: ${rule.references[0]}\n`);
        } else {
          output.push("References:");
          for (const ref of rule.references) {
            output.push(`- ${ref}`);
          }
          output.push("");
        }
      }

      output.push("---\n");
    }
  }

  // References section
  if (metadata.references && metadata.references.length > 0) {
    output.push("## References\n");
    for (const ref of metadata.references) {
      output.push(`- ${ref}`);
    }
    output.push("");
  }

  // Write output
  writeFileSync(AGENTS_OUTPUT, output.join("\n"));
  console.log(`Generated: ${AGENTS_OUTPUT}`);
  console.log(`Total rules: ${rules.length}`);
}

// Run build when executed directly
const isMainModule = process.argv[1]?.endsWith("build.ts") || process.argv[1]?.endsWith("build.js");

if (isMainModule) {
  buildAgents();
}

export { buildAgents };
