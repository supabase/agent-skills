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
	/** Files the agent created or modified in the workspace */
	filesModified: string[];
	error?: string;
}
