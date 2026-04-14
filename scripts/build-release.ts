import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"
import matter from "gray-matter"

const ROOT = join(import.meta.dirname, "..")
const SKILLS_DIR = join(ROOT, "skills")
const DIST_DIR = join(ROOT, "dist")

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

interface SkillEntry {
  name: string
  type: "archive"
  description: string
  url: string
  digest: string
}

/** Compute sha256 digest of a file, returned as "sha256:<hex>". */
function sha256File(filePath: string): string {
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex")
  return `sha256:${hash}`
}

mkdirSync(DIST_DIR, { recursive: true })

const skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

const skills: SkillEntry[] = []

for (const name of skillNames) {
  const skillDir = join(SKILLS_DIR, name)
  const skillMd = join(skillDir, "SKILL.md")
  const archivePath = join(DIST_DIR, `${name}.tar.gz`)

  if (!existsSync(skillMd)) throw new Error(`Missing SKILL.md in ${skillDir}`)
  const { data } = matter(readFileSync(skillMd, "utf8"))

  if (!data.description) throw new Error(`Missing 'description' in ${skillMd}`)

  // Archive contents at root (no wrapper dir), per RFC requirement
  execSync(`tar czf "${archivePath}" -C "${skillDir}" .`)

  const digest = sha256File(archivePath)

  skills.push({
    name,
    type: "archive",
    description: data.description,
    url: `/.well-known/agent-skills/${name}.tar.gz`,
    digest,
  })

  console.log(`  ${name}: ${digest}`)
}

const index = { $schema: SCHEMA, skills }
writeFileSync(join(DIST_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n")

console.log(`\nWrote dist/index.json with ${skills.length} skill(s)`)
