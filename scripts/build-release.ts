import { createHash } from "node:crypto"
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { create as createTar } from "tar"
import matter from "gray-matter"

const ROOT = join(import.meta.dirname, "..")
const SKILLS_DIR = join(ROOT, "skills")
const DIST_DIR = join(ROOT, "dist")

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

function listFiles(dir: string, prefix = ""): string[] {
  const entries: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      entries.push(...listFiles(join(dir, entry.name), rel))
    } else {
      entries.push(rel)
    }
  }
  return entries.sort()
}

function sha256File(filePath: string): string {
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex")
  return `sha256:${hash}`
}

mkdirSync(DIST_DIR, { recursive: true })

const skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

const skills: {
  name: string
  type: "archive"
  description: string
  url: string
  digest: string
}[] = []

for (const name of skillNames) {
  const skillDir = join(SKILLS_DIR, name)
  const skillMdPath = join(skillDir, "SKILL.md")

  const { data } = matter(readFileSync(skillMdPath, "utf8"))

  if (!data.name || typeof data.name !== "string") {
    throw new Error(`Missing or invalid 'name' in frontmatter: ${skillMdPath}`)
  }
  if (!data.description || typeof data.description !== "string") {
    throw new Error(
      `Missing or invalid 'description' in frontmatter: ${skillMdPath}`
    )
  }

  const files = listFiles(skillDir)
  const artifactPath = join(DIST_DIR, `${name}.tar.gz`)

  await createTar(
    { gzip: true, file: artifactPath, cwd: skillDir, portable: true, mtime: new Date(0) },
    files
  )

  const digest = sha256File(artifactPath)

  skills.push({ name, type: "archive", description: data.description, url: `${name}.tar.gz`, digest })
  console.log(`  ${name}: ${digest}`)
}

const index = { $schema: SCHEMA, skills }
writeFileSync(
  join(DIST_DIR, "index.json"),
  JSON.stringify(index, null, 2) + "\n"
)
console.log(`\nWrote dist/index.json with ${skills.length} skill(s)`)
