import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build package directory
export const BUILD_DIR = join(__dirname, "..");

// Skill directory (relative to build package)
export const SKILL_DIR = join(BUILD_DIR, "../../skills/postgresql-best-practices");

// Rules directory
export const RULES_DIR = join(SKILL_DIR, "rules");

// Output files
export const AGENTS_OUTPUT = join(SKILL_DIR, "AGENTS.md");
export const METADATA_FILE = join(SKILL_DIR, "metadata.json");
export const TEST_CASES_OUTPUT = join(BUILD_DIR, "test-cases.json");

// Section prefix to number mapping
export const SECTION_MAP: Record<string, number> = {
  query: 1,
  conn: 2,
  connection: 2,
  schema: 3,
  lock: 4,
  security: 5,
  data: 6,
  monitor: 7,
  advanced: 8,
};

// Valid impact levels in priority order
export const IMPACT_LEVELS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM-HIGH",
  "MEDIUM",
  "LOW-MEDIUM",
  "LOW",
] as const;
