# Release Process

Erris uses automated release management powered by
[Changesets](https://github.com/changesets/changesets) and GitHub Actions OIDC
Trusted Publishing.

---

## Release Overview

```text
Package-affecting PR with changeset
  └─> Merge to main
       └─> Release workflow runs full verification (`corepack pnpm check`)
            └─> Changesets opens or updates "version: release packages" PR
                 └─> Maintainer merges Release PR
                      └─> GitHub Actions publishes packages to npm via OIDC
```

---

## Available Commands

- `corepack pnpm changeset`: Interactive CLI prompt to declare package version
  bumps (patch, minor, major).
- `corepack pnpm changeset:status`: Check pending changesets against `main`.
- `corepack pnpm changeset:check`: Enforce changeset policy in CI for
  package-affecting changes.
- `corepack pnpm version:packages`: Consume changesets, update package versions,
  and update `CHANGELOG.md` files.

---

## Changeset Policy

Add a changeset when a commit changes published package behavior, public API,
runtime behavior, generated declarations, package exports, or package
dependencies.

Do not add a changeset for:

- Documentation-only changes
- Test-only changes
- CI-only changes
- Internal scripts that do not affect package output
- Repository maintenance changes

Version files and changelog updates are generated automatically by Changesets,
not handwritten.

---

## Automated Publishing via OIDC

Publishing is fully automated via `.github/workflows/release.yml` using npm
**OIDC Trusted Publishing**:

- Runs on pushes to `main`.
- Verifies exact packed artifacts and runs `corepack pnpm check`.
- Generates signed build provenance attestations
  (`NPM_CONFIG_PROVENANCE: true`).
- Uses short-lived OIDC tokens (`id-token: write`) instead of long-lived npm
  registry tokens.
