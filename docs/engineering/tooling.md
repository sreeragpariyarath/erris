# Tooling

This document records the initial repository tooling choices. It should be
updated when a tool is added, removed, or materially reconfigured.

## Runtime and Package Manager

- Node.js: `>=22.0.0`
- CI matrix: Node.js `22` and `24`
- Package manager: `pnpm@11.20.0` through Corepack

Corepack is used so contributors and CI use the package manager version pinned
in `package.json`.

## Local Commands

Run the complete local verification suite:

```sh
corepack pnpm check
```

Individual commands:

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Formatting can be applied with:

```sh
corepack pnpm format
```

## Tool Choices

- Prettier owns formatting for Markdown, JSON, YAML, and TypeScript config.
- ESLint owns static analysis for JavaScript and TypeScript.
- `typescript-eslint` is configured for type-aware linting.
- TypeScript is pinned to `6.0.3` because the current `typescript-eslint` stack
  supports TypeScript versions below `6.1`.
- Vitest is the initial runtime test runner.
- Markdownlint checks documentation structure.
- `publint` and `@arethetypeswrong/cli` are installed for package validation
  once publishable packages exist.

## Current Scope

The repository currently has no publishable packages and no library source
files. The verification setup intentionally passes without tests or workspace
packages so the tooling foundation can be committed before implementation.

Future package commits must add real tests, build scripts, package checks, and
consumer fixtures with the package behavior they introduce.
