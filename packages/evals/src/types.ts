export interface EvalScenario {
	/** Directory name under evals/ */
	id: string;
	/** Human-readable name */
	name: string;
	/** Tags for filtering */
	tags: string[];
}

export interface AgentConfig {
	/** Agent identifier */
	agent: "claude-code";
	/** Model to use */
	model: string;
	/** Whether the supabase skill is available */
	skillEnabled: boolean;
}

export interface EvalRunResult {
	scenario: string;
	agent: string;
	model: string;
	skillEnabled: boolean;
	status: "passed" | "failed" | "error";
	duration: number;
	testOutput: string;
	agentOutput: string;
	/** Number of vitest tests that passed */
	testsPassed: number;
	/** Total number of vitest tests */
	testsTotal: number;
	/** Minimum tests required to pass (from scenario config) */
	passThreshold?: number;
	/** Files the agent created or modified in the workspace */
	filesModified: string[];
	error?: string;
	/** Path to the persisted results directory for this run */
	resultsDir?: string;
	/** Number of tool calls the agent made */
	toolCallCount?: number;
	/** Total cost in USD (from stream-json result event) */
	costUsd?: number;
	/** The PROMPT.md content sent to the agent */
	prompt?: string;
	/** Per-test pass/fail results from vitest */
	individualTests?: Record<string, boolean>;
}
