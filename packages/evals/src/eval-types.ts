/**
 * A single assertion to run against the agent's workspace output.
 *
 * Used by EVAL.ts files to declare what the agent's work should produce.
 * The runner executes these in-process (no test framework required).
 */
export interface EvalAssertion {
	/** Human-readable name shown in Braintrust and local output */
	name: string;
	/** Return true = pass, false/throw = fail */
	check: () => boolean | Promise<boolean>;
	/** Timeout in ms for async checks (default: no timeout) */
	timeout?: number;
}

/** Result of running a single EvalAssertion */
export interface AssertionResult {
	name: string;
	passed: boolean;
	error?: string;
}
