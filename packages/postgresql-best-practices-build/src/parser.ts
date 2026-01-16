import { readFileSync } from "fs";
import { basename } from "path";
import type { Rule, CodeExample, ImpactLevel, ParseResult } from "./types.js";
import { SECTION_MAP, IMPACT_LEVELS } from "./config.js";

/**
 * Parse YAML-style frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const frontmatter: Record<string, string> = {};

  if (!content.startsWith("---")) {
    return { frontmatter, body: content };
  }

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return { frontmatter, body: content };
  }

  const frontmatterContent = content.slice(3, endIndex).trim();
  const body = content.slice(endIndex + 3).trim();

  for (const line of frontmatterContent.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Extract section number from filename prefix
 */
function getSectionFromFilename(filename: string): number | null {
  const base = basename(filename, ".md");
  const prefix = base.split("-")[0];
  return SECTION_MAP[prefix] ?? null;
}

/**
 * Extract code examples from markdown body
 */
function extractExamples(body: string): CodeExample[] {
  const examples: CodeExample[] = [];
  const lines = body.split("\n");

  let currentLabel = "";
  let currentDescription = "";
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockContent: string[] = [];
  let additionalText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for example label: **Label:** or **Label (description):**
    const labelMatch = line.match(/^\*\*([^*]+?)(?:\s*\(([^)]+)\))?\s*:\*\*\s*$/);
    if (labelMatch && !inCodeBlock) {
      // Save previous example if exists
      if (currentLabel && codeBlockContent.length > 0) {
        examples.push({
          label: currentLabel,
          description: currentDescription || undefined,
          code: codeBlockContent.join("\n"),
          language: codeBlockLang || undefined,
          additionalText: additionalText.length > 0 ? additionalText.join("\n").trim() : undefined,
        });
      }

      currentLabel = labelMatch[1].trim();
      currentDescription = labelMatch[2]?.trim() || "";
      codeBlockContent = [];
      codeBlockLang = "";
      additionalText = [];
      continue;
    }

    // Check for code block start
    if (line.startsWith("```") && !inCodeBlock) {
      inCodeBlock = true;
      codeBlockLang = line.slice(3).trim();
      continue;
    }

    // Check for code block end
    if (line.startsWith("```") && inCodeBlock) {
      inCodeBlock = false;
      continue;
    }

    // Collect code block content
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Collect additional text after code block (before next label)
    if (currentLabel && codeBlockContent.length > 0 && line.trim()) {
      // Stop collecting if we hit a heading or reference
      if (line.startsWith("#") || line.startsWith("Reference")) {
        continue;
      }
      additionalText.push(line);
    }
  }

  // Save last example
  if (currentLabel && codeBlockContent.length > 0) {
    examples.push({
      label: currentLabel,
      description: currentDescription || undefined,
      code: codeBlockContent.join("\n"),
      language: codeBlockLang || undefined,
      additionalText: additionalText.length > 0 ? additionalText.join("\n").trim() : undefined,
    });
  }

  return examples;
}

/**
 * Extract title from first ## heading
 */
function extractTitle(body: string): string | null {
  const match = body.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract explanation (content between title and first example)
 */
function extractExplanation(body: string): string {
  const lines = body.split("\n");
  const explanationLines: string[] = [];
  let foundTitle = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      foundTitle = true;
      continue;
    }

    if (!foundTitle) continue;

    // Stop at first example label or code block
    if (line.match(/^\*\*[^*]+:\*\*/) || line.startsWith("```")) {
      break;
    }

    explanationLines.push(line);
  }

  return explanationLines.join("\n").trim();
}

/**
 * Extract references from body
 */
function extractReferences(body: string): string[] {
  const references: string[] = [];
  const lines = body.split("\n");

  for (const line of lines) {
    // Match "Reference: [text](url)" or "- [text](url)" after "References:"
    const refMatch = line.match(/Reference:\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (refMatch) {
      references.push(refMatch[2]);
      continue;
    }

    // Match list items under References section
    const listMatch = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (listMatch) {
      references.push(listMatch[2]);
    }
  }

  return references;
}

/**
 * Extract Supabase notes
 */
function extractSupabaseNotes(body: string): string | undefined {
  const match = body.match(/\*\*Supabase Note:\*\*\s*(.+?)(?=\n\n|\n\*\*|$)/s);
  return match ? match[1].trim() : undefined;
}

/**
 * Parse a rule file and return structured data
 */
export function parseRuleFile(filePath: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    // Extract section from filename
    const section = getSectionFromFilename(filePath);
    if (section === null) {
      errors.push(`Could not determine section from filename: ${basename(filePath)}`);
      return { success: false, errors, warnings };
    }

    // Get title from frontmatter or body
    const title = frontmatter.title || extractTitle(body);
    if (!title) {
      errors.push("Missing title in frontmatter or body");
      return { success: false, errors, warnings };
    }

    // Get impact level
    const impact = frontmatter.impact as ImpactLevel;
    if (!impact || !IMPACT_LEVELS.includes(impact)) {
      errors.push(`Invalid or missing impact level: ${impact}. Must be one of: ${IMPACT_LEVELS.join(", ")}`);
      return { success: false, errors, warnings };
    }

    // Extract other fields
    const explanation = extractExplanation(body);
    const examples = extractExamples(body);
    const references = extractReferences(body);
    const supabaseNotes = extractSupabaseNotes(body);
    const tags = frontmatter.tags?.split(",").map((t) => t.trim()) || [];

    // Validation warnings
    if (!explanation || explanation.length < 20) {
      warnings.push("Explanation is very short or missing");
    }

    if (examples.length === 0) {
      warnings.push("No code examples found");
    }

    const rule: Rule = {
      id: "", // Will be assigned during build
      title,
      section,
      impact,
      impactDescription: frontmatter.impactDescription,
      explanation,
      examples,
      references: references.length > 0 ? references : undefined,
      tags: tags.length > 0 ? tags : undefined,
      supabaseNotes,
    };

    return { success: true, rule, errors, warnings };
  } catch (error) {
    errors.push(`Failed to parse file: ${error}`);
    return { success: false, errors, warnings };
  }
}
