# Tooling

This document records repository tooling choices for the Erris workspace
packages (`@erris/core`, `@erris/http`, `@erris/adapter-zod`,
`@erris/adapter-prisma`).

---

## Runtime and Package Manager

- **Node.js**: `>=22.0.0`
- **CI Matrix**: Node.js `22` and `24`
- **Package Manager**: `pnpm@11.20.0` managed through Corepack

---

## Local Verification Commands

Run the complete local verification suite:

```sh
corepack pnpm check
```

Individual checking commands:

```sh
corepack pnpm format:check      # Verify Prettier formatting
corepack pnpm lint              # Run ESLint & MarkdownLint
corepack pnpm changeset:check  # Enforce changeset policies
corepack pnpm typecheck         # Verify TypeScript type definitions
corepack pnpm test              # Run Vitest test suite
corepack pnpm build             # Build workspace ESM packages
corepack pnpm package:check     # Run publint & attw on packed artifacts
corepack pnpm consumer:check    # Verify tarball consumer fixtures
```

Apply formatting fixes automatically:

```sh
corepack pnpm format
```

---

## Tool Choices

- **Prettier**: Formatting for Markdown, JSON, YAML, and TypeScript.
- **ESLint**: Static analysis for JavaScript and TypeScript.
- **`typescript-eslint`**: Type-aware linting.
- **TypeScript**: Typed compilation and declaration generation.
- **Vitest**: Fast unit and integration test runner.
- **Markdownlint**: Structure and style checks for documentation.
- **`publint` & `@arethetypeswrong/cli`**: Package metadata and type export
  verification.
- **Changesets**: Versioning and changelog management.
