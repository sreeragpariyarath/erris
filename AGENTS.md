# Erris Agent Rules

These rules apply to the entire repository and to every automated coding
agent working in it.

## Authority boundaries

- Never commit, push, force-push, tag, publish, create a release, or change
  remote repository settings without an explicit user instruction for that
  action.
- An instruction to implement or fix code authorizes working-tree changes and
  verification. It does not authorize Git or npm publication actions.
- Never bypass a hook, required check, branch rule, or release approval.
- Never expose, print, store, or request secrets when a secretless workflow is
  possible.

## Working-tree discipline

- Inspect `git status` before editing.
- Preserve unrelated user changes and untracked files.
- Work on one coherent task slice at a time.
- Do not generate the complete project or an entire milestone in one change.
- Do not create one-line commits merely to show activity.
- Keep implementation, relevant tests, type tests, and documentation together
  in the same logical change.

## Green-history requirement

Every commit proposed for `main` must be bisectable:

- It builds and passes every check available at that commit.
- It represents one understandable behavior or infrastructure milestone.
- It does not depend on uncommitted follow-up work.
- Reverting the latest logical change restores the previous healthy state.

Before proposing a commit:

1. Review the complete diff.
2. Run the repository's full verification command.
3. Run package-consumer checks when exports or packaging changed.
4. Report any check that could not be executed.
5. Confirm that no unrelated file is staged.

## Security and dependency rules

- Prefer no dependency over a convenience dependency in core.
- Treat lockfiles, workflows, release configuration, and package manifests as
  security-sensitive code.
- Do not add a dependency without explaining its purpose, runtime impact,
  maintenance state, install scripts, and alternatives.
- Pin GitHub Actions to reviewed full commit SHAs.
- Use minimum workflow permissions.
- Never add a long-lived npm publishing token. Releases must use npm trusted
  publishing through OIDC.
- Do not add install-time lifecycle scripts without explicit review.
- Never serialize `cause`, stack traces, or internal context by default.

## Release rules

- Ordinary pull-request CI must never receive publishing credentials.
- Releases must originate from a protected, reviewed commit.
- The exact packed artifacts must pass consumer tests before publication.
- Git tag, package version, changelog, and artifact version must agree.
- Publishing requires an explicit user instruction and the protected release
  workflow. Never publish from a local development shell.
