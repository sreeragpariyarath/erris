# Git Policy

Erris treats history as part of the product. The goal is a readable,
bisectable sequence of independently healthy milestones.

## Main-branch policy

After CI is introduced:

- Changes enter `main` through pull requests.
- Required checks must pass before merge.
- Pull requests are squash-merged into one coherent main-branch commit.
- Force pushes and branch deletion are blocked.
- Release tags are protected.
- Direct pushes are reserved for repository bootstrap emergencies and require
  explicit maintainer approval.

## Commit unit

A commit is a logical behavior or infrastructure milestone. It is neither an
arbitrary line-count unit nor an entire finished product.

Good examples:

```text
chore(build): scaffold the TypeScript workspace and CI
feat(core): add immutable ErrisError identity
feat(core): define namespaced error catalogs
feat(core): compose catalogs with duplicate detection
feat(core): normalize unknown values through ordered adapters
feat(http): render exhaustive safe HTTP results
```

Implementation, tests, relevant type tests, and documentation belong in the
same commit when they describe one behavior.

## Green-history rule

Every commit on `main` must pass all checks that exist at that commit. A commit
must not rely on uncommitted follow-up work to compile or test successfully.

This does not mean any foundational commit can be deleted from later history;
later work may legitimately depend on it. It means checking out any main
commit is healthy, and reverting the latest logical change restores the
previous healthy state.

## Commit messages

Use Conventional Commit structure:

```text
type(optional-scope): imperative summary
```

Common types:

- `feat`: user-visible behavior
- `fix`: user-visible correction
- `docs`: documentation only
- `test`: tests without behavior change
- `refactor`: internal change without behavior change
- `perf`: measured performance improvement
- `build`: build system or package configuration
- `ci`: continuous integration or release automation
- `chore`: repository maintenance

Breaking changes require an explicit `!` or `BREAKING CHANGE` footer once a
public compatibility promise exists.

## Pull-request scope

A pull request should answer one reviewable question. Split a change when
parts can be reviewed, tested, reverted, or released independently. Keep parts
together when separating them would create a knowingly broken commit.

Before merge:

1. Review the full diff from the target branch.
2. Run the full local verification command.
3. Confirm tests describe the observable behavior.
4. Update public documentation and changeset when applicable.
5. Confirm generated and packed artifacts are intentional.
6. Confirm no unrelated user work is included.

## Release history

- Feature commits do not automatically imply package releases.
- Release automation batches coherent changes into a reviewed release PR.
- Versions begin in `0.x` while the API is experimental.
- Prereleases use a non-`latest` npm distribution tag.
- Version files, tags, changelog entries, and package artifacts are produced by
  the release workflow rather than handwritten across feature commits.

## Automated-agent policy

Automated agents may prepare working-tree changes and verification results.
They may not commit, push, tag, publish, or release without an explicit user
instruction for that action. See the repository-level `AGENTS.md`.
