/**
 * Evaluation scenario definition
 */
export interface EvalScenario {
  /** Unique identifier for the scenario */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this scenario tests */
  description: string;

  /** Category of the scenario */
  category: "query-performance" | "version-constraints" | "extension-requirements";

  /** Difficulty level */
  difficulty: "basic" | "intermediate" | "advanced";

  /** Input for the scenario */
  input: {
    /** SQL schema context */
    schema: string;

    /** User's question or request */
    userQuery: string;

    /** Optional PostgreSQL version (e.g., "10.0", "15.4") */
    postgresVersion?: string;

    /** Optional list of available extensions */
    availableExtensions?: string[];

    /** Additional context */
    context?: string;
  };

  /** Expected output criteria */
  expectedOutput: {
    /** Rule IDs that should be recommended */
    shouldRecommendRules: string[];

    /** Rule IDs that should NOT be recommended (version/extension constraints) */
    shouldNotRecommendRules?: string[];

    /** Strings that must appear in the response */
    mustContain: string[];

    /** Strings that must NOT appear in the response */
    mustNotContain?: string[];
  };

  /** Expected reasoning steps the agent should follow */
  expectedReasoning: string[];
}

/**
 * Result of evaluating a single criterion
 */
export interface CriterionResult {
  /** Description of the criterion */
  criterion: string;

  /** Whether the criterion passed */
  passed: boolean;

  /** Evidence or explanation */
  evidence?: string;
}

/**
 * Result of running an evaluation scenario
 */
export interface EvalResult {
  /** Scenario ID */
  scenarioId: string;

  /** Whether all criteria passed */
  passed: boolean;

  /** Rule IDs that were referenced in the response */
  rulesReferenced: string[];

  /** Results for each evaluation criterion */
  criteriaResults: CriterionResult[];

  /** The agent's full response */
  response: string;

  /** Time taken in milliseconds */
  latencyMs: number;

  /** Error message if evaluation failed */
  error?: string;
}

/**
 * Configuration for the eval runner
 */
export interface EvalConfig {
  /** Path to AGENTS.md file */
  agentsPath: string;

  /** Model to use for evaluation */
  model?: string;

  /** Maximum tokens for response */
  maxTokens?: number;

  /** Temperature for generation */
  temperature?: number;
}
