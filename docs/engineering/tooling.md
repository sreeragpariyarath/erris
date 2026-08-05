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
corepack pnpm changeset:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm package:check
corepack pnpm consumer:check
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
  against built package artifacts.
- Consumer checks pack local packages and install the exact tarballs into
  temporary fixture projects before running runtime and TypeScript checks.
- Changesets records package-affecting changes before release automation
  versions packages.

## Current Scope

The repository currently has an experimental `@erris/core` package. Package
checks validate both package metadata and packed-artifact consumption before
publication is allowed.

Future package commits must add real tests, build scripts, package checks, and
consumer fixtures with the package behavior they introduce.
