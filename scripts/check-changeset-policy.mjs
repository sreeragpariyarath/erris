/* global console, process */
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { env } from "node:process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const actor = (env.GITHUB_ACTOR ?? "").toLowerCase()
const headRef = (env.GITHUB_HEAD_REF ?? "").toLowerCase()
const refName = (env.GITHUB_REF_NAME ?? "").toLowerCase()

let isAutomatedPr =
  actor.includes("dependabot") ||
  headRef.startsWith("dependabot/") ||
  refName.startsWith("dependabot/") ||
  headRef.startsWith("changeset-release/") ||
  refName.startsWith("changeset-release/")

if (!isAutomatedPr) {
  try {
    const { stdout } = await execFileAsync("git", ["branch", "--show-current"])
    const branch = stdout.trim().toLowerCase()
    if (
      branch.startsWith("dependabot/") ||
      branch.startsWith("changeset-release/")
    ) {
      isAutomatedPr = true
    }
  } catch {
    // Ignore git failure when not in a git working tree
  }
}

if (isAutomatedPr) {
  console.log(
    "Automated PR (Dependabot or Changeset Release) detected; bypassing manual changeset check.",
  )
  process.exit(0)
}

const changedFiles = await getChangedFiles()
const packageAffectingChange = changedFiles.some(isPackageAffectingFile)
const changesetFiles = changedFiles.filter(isChangesetFile)

if (packageAffectingChange && changesetFiles.length === 0) {
  throw new Error(
    [
      "Package-affecting changes require a changeset.",
      "",
      "Run:",
      "  corepack pnpm changeset",
      "",
      "Use an empty docs/test/tooling commit only when no published package",
      "behavior, API, exports, declarations, dependencies, or runtime code",
      "changed.",
    ].join("\n"),
  )
}

if (!packageAffectingChange && changesetFiles.length > 0) {
  throw new Error(
    "Changeset files are only allowed with package-affecting changes.",
  )
}

async function getChangedFiles() {
  const baseRef = env.CHANGESET_BASE_REF ?? "origin/main"

  if (!existsSync(join(".git"))) {
    return []
  }

  try {
    const { stdout } = await execFileAsync("git", [
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      `${baseRef}...HEAD`,
    ])

    return stdout.split(/\r?\n/u).filter(Boolean)
  } catch {
    return []
  }
}

function isPackageAffectingFile(file) {
  if (/^packages\/[^/]+\/package\.json$/u.test(file)) {
    return true
  }

  if (/^packages\/[^/]+\/tsconfig\.build\.json$/u.test(file)) {
    return true
  }

  if (/^packages\/[^/]+\/src\/.*\.ts$/u.test(file)) {
    return !file.endsWith(".test.ts") && !file.endsWith(".type-test.ts")
  }

  return false
}

function isChangesetFile(file) {
  return (
    file.startsWith(".changeset/") &&
    file.endsWith(".md") &&
    file !== ".changeset/README.md"
  )
}
