import { exec, execFile } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { execPath } from "node:process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const packages = {
  core: join(root, "packages", "core"),
  http: join(root, "packages", "http"),
  adapterZod: join(root, "packages", "adapter-zod"),
}

const tarballs = await packPackages()
const installableHttpPackage = await createInstallablePackage(
  packages.http,
  tarballs.core,
)
const installableAdapterZodPackage = await createInstallablePackage(
  packages.adapterZod,
  tarballs.core,
)

const installablePackages = {
  core: tarballs.core,
  http: installableHttpPackage.tarball,
  adapterZod: installableAdapterZodPackage.tarball,
}

try {
  await runCoreEsmConsumer(installablePackages)
  await runCoreTypeScriptConsumer(installablePackages)
  await runHttpEsmConsumer(installablePackages)
  await runHttpTypeScriptConsumer(installablePackages)
  await runZodAdapterEsmConsumer(installablePackages)
  await runZodAdapterTypeScriptConsumer(installablePackages)
} finally {
  await Promise.all(
    [
      ...Object.values(tarballs),
      installableHttpPackage.tarball,
      installableHttpPackage.originalPackageJson,
      installableAdapterZodPackage.tarball,
      installableAdapterZodPackage.originalPackageJson,
    ].map((path) => rm(path, { force: true })),
  )
}

async function packPackages() {
  return {
    core: await packPackage(packages.core),
  }
}

async function packPackage(packagePath) {
  const { stdout } = await run("npm pack --silent", {
    cwd: packagePath,
  })

  return join(packagePath, stdout.trim())
}

async function createInstallablePackage(packagePath, coreTarball) {
  const packageJsonPath = join(packagePath, "package.json")
  const originalPackageJsonPath = join(
    packagePath,
    "package.consumer-check.json",
  )
  const originalPackageJson = JSON.parse(
    await readFile(packageJsonPath, "utf8"),
  )
  const installablePackageJson = {
    ...originalPackageJson,
    dependencies: {
      ...originalPackageJson.dependencies,
      "@erris/core": coreTarball,
    },
  }

  await writeJson(originalPackageJsonPath, originalPackageJson)
  await writeJson(packageJsonPath, installablePackageJson)

  try {
    return {
      tarball: await packPackage(packagePath),
      originalPackageJson: originalPackageJsonPath,
    }
  } finally {
    await writeJson(packageJsonPath, originalPackageJson)
  }
}

async function runCoreEsmConsumer(tarballs) {
  const fixture = await createFixture("erris-core-esm-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
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
        '  throw new Error("packed core ESM consumer failed")',
        "}",
        "",
      ].join("\n"),
    )

    await execFileAsync(execPath, ["index.mjs"], { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runCoreTypeScriptConsumer(tarballs) {
  const fixture = await createFixture("erris-core-ts-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
      typescript: "6.0.3",
    })
    await writeTsConfig(fixture)
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

    await run("npx tsc --noEmit", { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runHttpEsmConsumer(tarballs) {
  const fixture = await createFixture("erris-http-esm-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
      "@erris/http": tarballs.http,
    })

    await install(fixture)

    await writeFile(
      join(fixture, "index.mjs"),
      [
        'import { combineErrors, defineErrors } from "@erris/core"',
        'import { createHttpTransport } from "@erris/http"',
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
        "const render = createHttpTransport({",
        "  errors: Errors,",
        "  mappings: {",
        '    "user.email_exists": { status: 409, title: "Email exists" },',
        '    "app.internal": { status: 500, title: "Internal server error" },',
        "  },",
        '  fallback: { status: 500, title: "Internal server error", code: "internal" },',
        "})",
        "",
        "const response = render(UserErrors.EMAIL_EXISTS())",
        "",
        'if (response.status !== 409 || response.body.code !== "user.email_exists") {',
        '  throw new Error("packed HTTP ESM consumer failed")',
        "}",
        "",
      ].join("\n"),
    )

    await execFileAsync(execPath, ["index.mjs"], { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runHttpTypeScriptConsumer(tarballs) {
  const fixture = await createFixture("erris-http-ts-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
      "@erris/http": tarballs.http,
      typescript: "6.0.3",
    })
    await writeTsConfig(fixture)
    await install(fixture)

    await writeFile(
      join(fixture, "index.ts"),
      [
        'import { combineErrors, defineErrors } from "@erris/core"',
        'import { createHttpTransport, type ErrisHttpResponse } from "@erris/http"',
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
        "const render = createHttpTransport({",
        "  errors: Errors,",
        "  mappings: {",
        '    "user.email_exists": { status: 409, title: "Email exists" },',
        '    "app.internal": { status: 500, title: "Internal server error" },',
        "  },",
        '  fallback: { status: 500, title: "Internal server error", code: "internal" },',
        "})",
        "",
        "const response: ErrisHttpResponse = render(UserErrors.EMAIL_EXISTS())",
        "const status: number = response.status",
        "",
        "void status",
        "",
      ].join("\n"),
    )

    await run("npx tsc --noEmit", { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runZodAdapterEsmConsumer(tarballs) {
  const fixture = await createFixture("erris-zod-esm-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
      "@erris/adapter-zod": tarballs.adapterZod,
      zod: "3.24.2",
    })

    await install(fixture)

    await writeFile(
      join(fixture, "index.mjs"),
      [
        'import { createNormalizer, defineErrors, isErrisError } from "@erris/core"',
        'import { createZodAdapter } from "@erris/adapter-zod"',
        'import { z } from "zod"',
        "",
        'const AppErrors = defineErrors("app", {',
        '  INTERNAL: { message: "Internal error" },',
        '  VALIDATION: { message: "Validation error" },',
        "})",
        "",
        "const adapter = createZodAdapter({ target: AppErrors.VALIDATION })",
        "const normalize = createNormalizer({ fallback: AppErrors.INTERNAL, adapters: [adapter] })",
        "",
        "let zodErr",
        "try { z.string().parse(123) } catch (e) { zodErr = e }",
        "const normalized = normalize(zodErr)",
        "",
        'if (!isErrisError(normalized) || normalized.code !== "app.validation") {',
        '  throw new Error("packed Zod adapter ESM consumer failed")',
        "}",
        "",
      ].join("\n"),
    )

    await execFileAsync(execPath, ["index.mjs"], { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function runZodAdapterTypeScriptConsumer(tarballs) {
  const fixture = await createFixture("erris-zod-ts-")

  try {
    await writePackageJson(fixture, {
      "@erris/core": tarballs.core,
      "@erris/adapter-zod": tarballs.adapterZod,
      zod: "3.24.2",
      typescript: "6.0.3",
    })
    await writeTsConfig(fixture)
    await install(fixture)

    await writeFile(
      join(fixture, "index.ts"),
      [
        'import { createNormalizer, defineErrors } from "@erris/core"',
        'import { createZodAdapter } from "@erris/adapter-zod"',
        'import { z } from "zod"',
        "",
        'const AppErrors = defineErrors("app", {',
        '  INTERNAL: { message: "Internal error" },',
        '  VALIDATION: { message: "Validation error" },',
        "})",
        "",
        "const adapter = createZodAdapter({ target: AppErrors.VALIDATION })",
        "const normalize = createNormalizer({ fallback: AppErrors.INTERNAL, adapters: [adapter] })",
        "",
        "let zodErr",
        "try { z.string().parse(123) } catch (e) { zodErr = e }",
        "const normalized = normalize(zodErr)",
        "const code: string = normalized.code",
        "",
        "void code",
        "",
      ].join("\n"),
    )

    await run("npx tsc --noEmit", { cwd: fixture })
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

async function createFixture(prefix) {
  return mkdtemp(join(tmpdir(), prefix))
}

async function install(cwd) {
  await run("npm install --no-audit --no-fund", { cwd })
}

async function run(command, options) {
  try {
    return await execAsync(command, options)
  } catch (error) {
    if (error && typeof error === "object") {
      const details = error
      const message = [
        `Command failed: ${command}`,
        `cwd: ${options.cwd}`,
        details.stdout === undefined ? "" : `stdout:\n${details.stdout}`,
        details.stderr === undefined ? "" : `stderr:\n${details.stderr}`,
      ]
        .filter(Boolean)
        .join("\n\n")

      throw new Error(message, { cause: error })
    }

    throw error
  }
}

async function writePackageJson(fixture, dependencies) {
  await writeJson(join(fixture, "package.json"), {
    type: "module",
    dependencies,
  })
}

async function writeTsConfig(fixture) {
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
}

async function writeJson(path, value) {
  await writeFile(`${path}`, `${JSON.stringify(value, null, 2)}\n`)
}
