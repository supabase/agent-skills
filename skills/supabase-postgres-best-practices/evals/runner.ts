import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CriterionResult, EvalConfig, EvalResult, EvalScenario } from "./types.js";

const DEFAULT_CONFIG: EvalConfig = {
  agentsPath: join(import.meta.dirname, "..", "AGENTS.md"),
  model: "claude-sonnet-4-20250514",
  maxTokens: 2048,
  temperature: 0,
};

/**
 * Build the user prompt from a scenario
 */
function buildUserPrompt(scenario: EvalScenario): string {
  const parts: string[] = [];

  // Add version context if specified
  if (scenario.input.postgresVersion) {
    parts.push(`PostgreSQL Version: ${scenario.input.postgresVersion}`);
  }

  // Add extensions context if specified
  if (scenario.input.availableExtensions) {
    if (scenario.input.availableExtensions.length === 0) {
      parts.push("Available Extensions: None installed");
    } else {
      parts.push(`Available Extensions: ${scenario.input.availableExtensions.join(", ")}`);
    }
  }

  // Add additional context if provided
  if (scenario.input.context) {
    parts.push(`Context: ${scenario.input.context}`);
  }

  // Add schema
  parts.push(`\nSchema:\n\`\`\`sql\n${scenario.input.schema}\n\`\`\``);

  // Add user query
  parts.push(`\nQuestion: ${scenario.input.userQuery}`);

  return parts.join("\n");
}

/**
 * Extract rule IDs mentioned in a response
 */
function extractRuleIds(response: string): string[] {
  // Match patterns like "1.1", "2.3", etc.
  const rulePattern = /\b(\d+\.\d+)\b/g;
  const matches = response.match(rulePattern) || [];
  return [...new Set(matches)];
}

/**
 * Evaluate the response against expected criteria
 */
function evaluateCriteria(scenario: EvalScenario, response: string): CriterionResult[] {
  const results: CriterionResult[] = [];
  const responseLower = response.toLowerCase();

  // Check mustContain criteria
  for (const term of scenario.expectedOutput.mustContain) {
    const found = responseLower.includes(term.toLowerCase());
    results.push({
      criterion: `Response should contain "${term}"`,
      passed: found,
      evidence: found ? "Found in response" : "Not found in response",
    });
  }

  // Check mustNotContain criteria
  if (scenario.expectedOutput.mustNotContain) {
    for (const term of scenario.expectedOutput.mustNotContain) {
      const found = responseLower.includes(term.toLowerCase());
      results.push({
        criterion: `Response should NOT contain "${term}"`,
        passed: !found,
        evidence: found ? "Found in response (should not be present)" : "Not found (correct)",
      });
    }
  }

  // Check shouldRecommendRules
  const referencedRules = extractRuleIds(response);
  for (const ruleId of scenario.expectedOutput.shouldRecommendRules) {
    const found = referencedRules.includes(ruleId);
    results.push({
      criterion: `Should recommend rule ${ruleId}`,
      passed: found,
      evidence: found ? "Rule referenced" : "Rule not referenced",
    });
  }

  // Check shouldNotRecommendRules
  if (scenario.expectedOutput.shouldNotRecommendRules) {
    for (const ruleId of scenario.expectedOutput.shouldNotRecommendRules) {
      const found = referencedRules.includes(ruleId);
      results.push({
        criterion: `Should NOT recommend rule ${ruleId}`,
        passed: !found,
        evidence: found ? "Rule referenced (should not be)" : "Rule not referenced (correct)",
      });
    }
  }

  return results;
}

/**
 * Run a single evaluation scenario
 */
export async function runEval(
  scenario: EvalScenario,
  config: Partial<EvalConfig> = {}
): Promise<EvalResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Load AGENTS.md
    const agentsMd = readFileSync(finalConfig.agentsPath, "utf-8");

    const systemPrompt = `You are a PostgreSQL expert assistant. Use the following knowledge base to provide accurate recommendations:

${agentsMd}

IMPORTANT: When the user specifies a PostgreSQL version or available extensions, you MUST respect those constraints:
- Do not recommend features that require a higher PostgreSQL version than specified
- Do not recommend extensions that are not available
- If a recommended optimization requires a specific version or extension, mention the prerequisite

When making recommendations, reference specific rule IDs (e.g., "1.1", "2.3") from the knowledge base.`;

    const userPrompt = buildUserPrompt(scenario);

    const start = Date.now();
    const { text } = await generateText({
      model: anthropic(finalConfig.model!),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
    });
    const latencyMs = Date.now() - start;

    // Evaluate the response
    const criteriaResults = evaluateCriteria(scenario, text);
    const rulesReferenced = extractRuleIds(text);
    const passed = criteriaResults.every((r) => r.passed);

    return {
      scenarioId: scenario.id,
      passed,
      rulesReferenced,
      criteriaResults,
      response: text,
      latencyMs,
    };
  } catch (error) {
    return {
      scenarioId: scenario.id,
      passed: false,
      rulesReferenced: [],
      criteriaResults: [],
      response: "",
      latencyMs: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run multiple evaluation scenarios
 */
export async function runEvals(
  scenarios: EvalScenario[],
  config: Partial<EvalConfig> = {}
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const scenario of scenarios) {
    console.log(`Running eval: ${scenario.name}...`);
    const result = await runEval(scenario, config);
    results.push(result);
    console.log(`  ${result.passed ? "PASS" : "FAIL"} (${result.latencyMs}ms)`);
  }

  return results;
}
