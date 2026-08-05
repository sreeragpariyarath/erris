import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { execPath } from "node:process"
import { fileURLToPath } from "node:url"
import { exec, execFile } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const corePackage = join(root, "packages", "core")

const tarballName = await packCore()
const tarballPath = join(corePackage, tarballName)

try {
  await runEsmConsumer(tarballPath)
  await runTypeScriptConsumer(tarballPath)
} finally {
  await rm(tarballPath, { force: true })
}

async function packCore() {
  const { stdout } = await execAsync("npm pack --silent", {
    cwd: corePackage,
  })

  return stdout.trim()
}

async function runEsmConsumer(tarballPath) {
  const fixture = await createFixture("erris-core-esm-")

  try {
    await writeJson(join(fixture, "package.json"), {
      type: "module",
      dependencies: {
        "@erris/core": tarballPath,
      },
    })

    await install(fixture)

    await writeFile(
      join(fixture, "index.mjs"),
      [
        'import { createNormalizer, defineErrors, isErrisError } from "@erris/core"',
        "",
        'const Errors = defineErrors("app", {',
        '  INTERNAL: { message: "Internal error" },',
        '  LEGACY: { message: "Legacy failure" },',
        "})",
        "",
        "const normalize = createNormalizer({",
        "  fallback: Errors.INTERNAL,",
        "  adapters: [",
        "    {",
        '      name: "legacy",',
        "      tryNormalize(value) {",
        '        return value instanceof Error && value.message === "legacy"',
        "          ? Errors.LEGACY({ cause: value })",
        "          : undefined",
        "      },",
        "    },",
        "  ],",
        "})",
        "",
        'const normalized = normalize(new Error("legacy"))',
        "",
        'if (!isErrisError(normalized) || normalized.code !== "app.legacy") {',
        '  throw new Error("packed ESM consumer failed")',
        "}",
        "",
      ].join("\n"),
    )

    await execFileAsync(execPath, ["index.mjs"], { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runTypeScriptConsumer(tarballPath) {
  const fixture = await createFixture("erris-core-ts-")

  try {
    await writeJson(join(fixture, "package.json"), {
      type: "module",
      dependencies: {
        "@erris/core": tarballPath,
        typescript: "6.0.3",
      },
    })
    await writeJson(join(fixture, "tsconfig.json"), {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noEmit: true,
      },
      include: ["index.ts"],
    })

    await install(fixture)

    await writeFile(
      join(fixture, "index.ts"),
      [
        'import { combineErrors, createNormalizer, defineErrors, type ErrisAdapter } from "@erris/core"',
        "",
        'const UserErrors = defineErrors("user", {',
        '  EMAIL_EXISTS: { message: "Email exists" },',
        "})",
        "",
        'const AppErrors = defineErrors("app", {',
        '  INTERNAL: { message: "Internal error" },',
        "})",
        "",
        "const Errors = combineErrors(UserErrors, AppErrors)",
        "",
        "const adapter: ErrisAdapter = {",
        '  name: "none",',
        "  tryNormalize() {",
        "    return undefined",
        "  },",
        "}",
        "",
        "const normalize = createNormalizer({",
        "  fallback: Errors.INTERNAL,",
        "  adapters: [adapter],",
        "})",
        "",
        'const code: "user.email_exists" = Errors.EMAIL_EXISTS().code',
        "const normalized = normalize(null)",
        "const normalizedCode: string = normalized.code",
        "",
        "void code",
        "void normalizedCode",
        "",
      ].join("\n"),
    )

    await execAsync("npx tsc --noEmit", { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function createFixture(prefix) {
  return mkdtemp(join(tmpdir(), prefix))
}

async function install(cwd) {
  await execAsync("npm install --silent --no-audit --no-fund", { cwd })
}

async function writeJson(path, value) {
  await writeFile(`${path}`, `${JSON.stringify(value, null, 2)}\n`)
}
