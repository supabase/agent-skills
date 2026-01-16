import { readdirSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { parseRuleFile } from "./parser.js";
import { validateRuleFile } from "./validate.js";
import { RULES_DIR, TEST_CASES_OUTPUT } from "./config.js";
import type { TestCase } from "./types.js";

/**
 * Check if an example label indicates a "bad" pattern
 */
function isBadExample(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes("incorrect") || lower.includes("wrong") || lower.includes("bad");
}

/**
 * Check if an example label indicates a "good" pattern
 */
function isGoodExample(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes("correct") ||
    lower.includes("good") ||
    lower.includes("usage") ||
    lower.includes("implementation") ||
    lower.includes("example") ||
    lower.includes("recommended")
  );
}

/**
 * Extract test cases from all rule files
 */
function extractTestCases(): TestCase[] {
  const testCases: TestCase[] = [];

  // Get all rule files
  const ruleFiles = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => join(RULES_DIR, f));

  // Track rule IDs by section for assignment
  const ruleCountBySection = new Map<number, number>();

  for (const file of ruleFiles) {
    const validation = validateRuleFile(file);
    if (!validation.valid) {
      continue;
    }

    const result = parseRuleFile(file);
    if (!result.success || !result.rule) {
      continue;
    }

    const rule = result.rule;

    // Assign rule ID
    const sectionCount = (ruleCountBySection.get(rule.section) || 0) + 1;
    ruleCountBySection.set(rule.section, sectionCount);
    const ruleId = `${rule.section}.${sectionCount}`;

    // Extract test cases from examples
    for (const example of rule.examples) {
      if (!example.code || example.code.trim().length === 0) {
        continue;
      }

      let type: "bad" | "good" | null = null;

      if (isBadExample(example.label)) {
        type = "bad";
      } else if (isGoodExample(example.label)) {
        type = "good";
      }

      if (type) {
        testCases.push({
          ruleId,
          ruleTitle: rule.title,
          type,
          code: example.code,
          language: example.language || "sql",
          description: example.description || `${example.label} example for ${rule.title}`,
        });
      }
    }
  }

  return testCases;
}

// Run extraction when executed directly
const isMainModule = process.argv[1]?.endsWith("extract-tests.ts") || process.argv[1]?.endsWith("extract-tests.js");

if (isMainModule) {
  console.log("Extracting test cases from rules...\n");

  const testCases = extractTestCases();

  if (testCases.length === 0) {
    console.log("No test cases extracted (no valid rules found).");
    console.log("This is expected for initial setup.\n");

    // Write empty array
    writeFileSync(TEST_CASES_OUTPUT, JSON.stringify([], null, 2));
    console.log(`Generated: ${TEST_CASES_OUTPUT} (empty)`);
    process.exit(0);
  }

  // Write test cases
  writeFileSync(TEST_CASES_OUTPUT, JSON.stringify(testCases, null, 2));

  console.log(`Generated: ${TEST_CASES_OUTPUT}`);
  console.log(`Total test cases: ${testCases.length}`);
  console.log(`  Bad examples: ${testCases.filter((t) => t.type === "bad").length}`);
  console.log(`  Good examples: ${testCases.filter((t) => t.type === "good").length}`);
}

export { extractTestCases };
