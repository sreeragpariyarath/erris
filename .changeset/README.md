# Changesets

Changesets record package-affecting changes before release automation versions
the packages.

Create a changeset for user-visible package changes:

```sh
corepack pnpm changeset
```

Do not create a changeset for documentation-only, test-only, or repository
tooling changes that do not affect published package behavior.

Publishing is not configured in this repository yet. Versioning and publishing
must happen through reviewed automation, not from a local shell.
