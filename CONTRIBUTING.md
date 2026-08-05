# Contributing to Erris

Erris is still validating its architecture. Small, focused proposals and
executable evidence are more useful than broad feature additions at this stage.

## Before starting

For a significant behavior or public API change, open a discussion or issue
before implementation. Describe:

- The application problem being solved
- Why the existing proposal does not solve it
- The smallest observable behavior that would validate the idea
- Compatibility, security, and migration consequences

Security vulnerabilities must be reported privately according to
[SECURITY.md](SECURITY.md), not through a public issue.

## Development workflow

Repository tooling will be added with the first implementation milestone. Until
then, documentation changes should be checked for coherent terminology, working
links, and clean Markdown diffs.

Once the workspace exists, contributors will be able to run a single local
verification command covering formatting, linting, types, tests, builds, and
package-consumer checks. The command will be documented here rather than
invented before it exists.

## Change scope

- Keep each pull request focused on one reviewable question.
- Include implementation, relevant tests, type tests, and documentation in the
  same logical change.
- Do not mix refactoring with unrelated behavior changes.
- Do not add dependencies without documenting their purpose and security impact.
- Do not weaken safety defaults to make an integration more convenient.

Read the [Git policy](docs/engineering/git-policy.md),
[quality policy](docs/engineering/quality-policy.md), and
[threat model](docs/security/threat-model.md) before contributing code.

## Commits and pull requests

Use Conventional Commit messages. Every commit intended for `main` must be
healthy when checked out independently. Pull requests must pass all required
checks and receive review before merge.

Maintainers may ask for a change to be split or combined when doing so makes
review, testing, rollback, or release safer.

## Project conduct and licensing

Be respectful, specific, and constructive. A formal code of conduct and the
project license must be selected by the project owner before Erris begins
accepting broad external contributions.
