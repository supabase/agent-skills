import { createHash } from "node:crypto"
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { join, relative } from "node:path"
import { execFileSync } from "node:child_process"
import matter from "gray-matter"

const ROOT = join(import.meta.dirname, "..")
const SKILLS_DIR = join(ROOT, "skills")
const DIST_DIR = join(ROOT, "dist")

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

const DEFAULT_EXCLUDES = [
  ".git",
  ".gitignore",
  ".gitattributes",
  ".DS_Store",
  "Thumbs.db",
  ".vscode",
  ".idea",
  "*.swp",
  ".*.swp",
  "*~",
  ".*~",
]

// Patterns without "/" match basenames at any depth; with "/" match relative paths.
function matchesExclude(relPath: string, patterns: string[]): boolean {
  const basename = relPath.split("/").pop()!
  for (const pattern of patterns) {
    const target = pattern.includes("/") ? relPath : basename
    if (matchesGlob(target, pattern)) return true
  }
  return false
}

function matchesGlob(str: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "[^/]*") + "$"
  )
  return regex.test(str)
}

function walkDir(dir: string, base: string = dir): string[] {
  const entries: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absPath = join(dir, entry.name)
    const relPath = relative(base, absPath)
    if (matchesExclude(relPath, DEFAULT_EXCLUDES)) continue
    if (entry.isDirectory()) {
      entries.push(...walkDir(absPath, base))
    } else {
      entries.push(relPath)
    }
  }
  return entries.sort()
}

function sha256File(filePath: string): string {
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex")
  return `sha256:${hash}`
}

// Two-step deterministic archive: zero all metadata so digests only change
// when content changes, which is the whole point of the digest field for caching.
// Requires GNU tar (available on Linux/CI). On macOS, falls back to BSD tar
// with a warning — digests will differ across builds but remain functionally valid.
function createDeterministicTarGz(
  skillDir: string,
  files: string[],
  outputPath: string
): void {
  const tarPath = outputPath.replace(/\.gz$/, "")

  // tar --no-recursion needs explicit parent dir entries
  const dirs = new Set<string>()
  for (const f of files) {
    const parts = f.split("/")
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"))
    }
  }
  const entries = [...Array.from(dirs).sort(), ...files]

  // Prefer gtar (GNU tar via Homebrew on macOS) for deterministic output
  const tarBin = (() => {
    try {
      execFileSync("gtar", ["--version"], { stdio: "ignore" })
      return "gtar"
    } catch {
      return "tar"
    }
  })()

  try {
    execFileSync(tarBin, [
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "--no-recursion",
      "-cf",
      tarPath,
      "-C",
      skillDir,
      ...entries,
    ])
  } catch {
    // BSD tar (macOS default) — non-deterministic but functionally valid
    console.warn(
      `  warning: GNU tar not found, using BSD tar — digests will vary across builds (install GNU tar for reproducible builds)`
    )
    execFileSync("tar", ["-cf", tarPath, "-C", skillDir, ...entries])
  }

  // -n: omit original filename and timestamp from gzip header
  execFileSync("gzip", ["-nf", tarPath])
}

mkdirSync(DIST_DIR, { recursive: true })

const skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

const skills: {
  name: string
  type: "skill-md" | "archive"
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

  const files = walkDir(skillDir)
  const isSingleFile = files.length === 1 && files[0] === "SKILL.md"

  let type: "skill-md" | "archive"
  let artifactPath: string
  let url: string

  if (isSingleFile) {
    // Single-file skill: copy SKILL.md directly, no archive needed
    type = "skill-md"
    const destDir = join(DIST_DIR, name)
    mkdirSync(destDir, { recursive: true })
    artifactPath = join(destDir, "SKILL.md")
    copyFileSync(skillMdPath, artifactPath)
    url = `${name}/SKILL.md`
  } else {
    type = "archive"
    artifactPath = join(DIST_DIR, `${name}.tar.gz`)
    createDeterministicTarGz(skillDir, files, artifactPath)
    url = `${name}.tar.gz`
  }

  const digest = sha256File(artifactPath)

  skills.push({ name, type, description: data.description, url, digest })
  console.log(`  ${name} (${type}): ${digest}`)
}

const index = { $schema: SCHEMA, skills }
writeFileSync(
  join(DIST_DIR, "index.json"),
  JSON.stringify(index, null, 2) + "\n"
)
console.log(`\nWrote dist/index.json with ${skills.length} skill(s)`)
