# Erris Project Plan

## Purpose

Erris is a runtime error contract system for JavaScript and TypeScript.

The project exists to eliminate repeated hand-written backend error-boundary
machinery: custom `AppError` utilities, vendor-specific catch blocks,
unknown-error fallbacks, response mapping, redaction decisions, and manually
synchronized client error contracts.

The core idea is:

```text
Declare failure policy once -> normalize any thrown value -> render safely at boundaries
```

Erris should not merely make error classes nicer. It should make the error
boundary itself declarative, typed, testable, and reusable.

## Product Thesis

Every serious Node.js backend eventually grows the same hidden system:

- A local error class or factory
- A list of application error codes
- A catch-all unknown-error handler
- Vendor-specific error handling for tools such as Prisma and Zod
- HTTP response mapping
- Redaction rules
- Client-facing error documentation

Erris turns that hidden system into explicit infrastructure.

The adoption bet is that developers will accept a declarative error catalog when
it removes enough repeated boundary code and gives them stronger guarantees than
an ad hoc `AppError` helper.

## Architecture

The accepted v0 architecture is documented in
[RFC-0002](rfcs/0002-runtime-error-contract.md).

The working model is:

```text
Catalog factories --------------------------+
                                             |
Unknown values -> configured normalizer -> ErrisError occurrence
                                             |
                                             v
                                      transport renderer
                                             |
                                             v
                                      framework delivery
```

### Core Responsibilities

`@erris/core` owns:

- `ErrisError`
- `defineErrors()`
- `combineErrors()`
- `createNormalizer()`
- `isErrisError()`
- Adapter protocol types

Core must stay transport-neutral. It must not know about HTTP statuses, GraphQL
errors, gRPC status codes, logging, tracing, Sentry, OpenAPI, or framework
response APIs.

### Transport Responsibilities

Transport packages own boundary-specific rendering.

`@erris/http` should map declared Erris codes to HTTP status, public title,
public detail, headers, and a safe response body.

HTTP behavior must not leak stack, cause, database details, validation
internals, or arbitrary structured context unless the transport policy
explicitly projects that information into a public field.

### Adapter Responsibilities

Adapters classify external or legacy errors and convert them into application
catalog identities through explicit configuration.

Reusable adapters must not invent business meaning. For example, Prisma `P2002`
means a unique constraint failed; it does not universally mean
`user.email_exists`.

### Framework Responsibilities

Framework integrations are glue only:

1. Catch a thrown value.
2. Normalize it.
3. Render it through a transport.
4. Send it with the framework API.

Framework packages should not own domain policy, vendor mappings, logging
decisions, or redaction rules.

## Public API Direction

Current candidate API:

```ts
const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "A user with this email already exists",
  },
})

const normalize = createNormalizer({
  fallback: UserErrors.INTERNAL,
  adapters: [],
})

throw normalize(cause)
```

Intentional exclusions:

- No `safeNormalize()`: normalization has no success branch.
- No `fromUnknown()`: `normalize()` accepts `unknown`.
- No HTTP status in core.
- No global mutable registry.
- No logging, tracing, monitoring, or Sentry behavior in core.

## Package Roadmap

Packages should be added only when they have real behavior and tests.

1. `@erris/core`
2. `@erris/http`
3. `@erris/adapter-prisma`
4. `@erris/adapter-zod`
5. Framework integrations after direct HTTP dogfooding

Empty publishable packages are avoided. A workspace may anticipate future
packages, but npm packages should not be published until their behavior is
implemented, tested, and documented.

## Implementation Stages

### Stage 1: Project Foundation

Status: complete.

Goal: establish durable project direction before writing package code.

Deliverables:

- README with clear product direction
- Architecture RFC
- Git policy
- Quality policy
- Threat model
- Security reporting policy
- Contributor guide
- Repository agent rules
- This project plan

Exit criteria:

- Markdown links resolve
- No package or release automation exists yet
- No commit, push, tag, publish, or release happens without explicit owner
  approval

### Stage 2: Tooling Foundation

Status: complete.

Goal: create a small TypeScript workspace that can prove every future commit is
healthy.

Likely deliverables:

- Root package manifest
- Workspace configuration
- TypeScript configuration
- Formatter
- Linter
- Markdown linter
- Test runner
- Type-test setup
- Build command
- Local `check` command
- Initial CI for pull requests
- Tooling documentation

Exit criteria:

- Clean install works from lockfile
- `check` passes locally
- CI runs the same meaningful checks
- No public package is published
- Tool choices are documented

### Stage 3: Core Vertical Slice

Status: in progress locally.

Goal: implement the smallest useful `@erris/core`.

Likely deliverables:

- `ErrisError`
- `isErrisError()`
- `defineErrors()`
- Catalog immutability
- Typed factories
- Namespaced codes
- `combineErrors()`
- Duplicate-code detection
- `createNormalizer()`
- Adapter ordering
- Safe fallback normalization
- Runtime tests
- Type tests
- Package-consumer tests

Exit criteria:

- Unknown thrown values normalize safely
- Existing `ErrisError` values pass through unchanged
- Catalog code inference is useful in real TypeScript
- Hostile input tests exist
- Packed package works in a consumer fixture

### Stage 4: HTTP Transport

Goal: prove Erris can safely render a boundary response without putting HTTP in
core.

Likely deliverables:

- `@erris/http`
- Exhaustive mapping from catalog codes to HTTP outputs
- Safe unknown-error default
- RFC 9457-compatible response option if it proves useful
- Runtime tests
- Type tests for missing and extra mappings
- Consumer fixture

Exit criteria:

- Missing declared mappings fail at compile time where practical
- Unknown/internal errors do not leak private details
- Output shape is stable and documented
- Direct HTTP usage is ergonomic before framework middleware exists

### Stage 5: Adapter Protocol Proof

Goal: validate that adapters remove real vendor-switch code without hiding
business policy.

Likely deliverables:

- Prisma adapter experiment
- Zod adapter experiment
- Legacy application error adapter example
- Adapter authoring guide
- Integration tests using realistic fixtures

Exit criteria:

- Adapter configuration is explicit
- Vendor facts are separated from business meaning
- Ordered matching is understandable
- Existing app errors can be migrated gradually

### Stage 6: Dogfooding

Goal: use Erris in a production-style backend before expanding the ecosystem.

Likely deliverables:

- Example backend
- Real route/service boundaries
- Realistic unknown-error behavior
- Prisma or Zod integration if applicable
- Comparison against equivalent hand-written code

Exit criteria:

- Erris removes meaningful repeated error-boundary code
- Throw sites remain readable
- Transport mappings are safer than hand-written switches
- The API does not need wrapper code to feel usable
- The library is voluntarily kept after the experiment

### Stage 7: Release System

Goal: prepare real package publication without long-lived secrets or manual
artifact drift.

Likely deliverables:

- Changeset or equivalent release flow
- Protected release workflow
- npm trusted publishing
- Provenance
- Tarball verification
- Version and changelog automation
- Release documentation

Exit criteria:

- Release workflow publishes only reviewed commits
- CI verifies exact packed artifacts before publishing
- npm write tokens are not stored as long-lived repository secrets
- Registry metadata is verified after publish

### Stage 8: Ecosystem Expansion

Goal: add integrations only after core and HTTP behavior prove durable.

Candidates:

- Express
- Fastify
- Hono
- NestJS
- GraphQL
- gRPC
- CLI
- OpenAPI/documentation generation
- Observability integrations

Each package needs its own tests, consumer fixture, documentation, and release
readiness review.

## Engineering Rules

Erris history must stay readable and bisectable.

- Each commit should be a logical healthy milestone.
- Do not push one giant finished product.
- Do not push meaningless one-line commits.
- Every commit on `main` should pass the checks that exist at that commit.
- Commit, push, tag, publish, and release only with explicit owner approval.
- Keep implementation, tests, and documentation together when they describe one
  behavior.
- Avoid unrelated formatting churn.
- Preserve user work in the working tree.

## Security Rules

The project assumes both runtime inputs and the package supply chain are
security-sensitive.

- Prefer zero runtime dependencies in core.
- Commit and review lockfiles.
- Use deterministic installs in CI.
- Review new dependencies before adding them.
- Avoid install scripts where possible.
- Pin GitHub Actions by full commit SHA once workflows are introduced.
- Use minimum workflow permissions.
- Do not expose secrets to untrusted pull-request code.
- Use npm trusted publishing with provenance.
- Protect maintainer accounts with strong 2FA or passkeys.

See the [threat model](security/threat-model.md) for details.

## Open Decisions

These must be answered by implementation evidence, not theory alone:

- Exact structured context API
- Cross-copy and cross-realm `ErrisError` identification
- ESM-only or dual ESM/CommonJS package output
- Minimum supported TypeScript version
- Minimum supported Node.js versions
- Whether sealed catalogs are needed
- Exact HTTP response shape
- Exact release tool
- License
- Code of conduct policy

## Current Next Step

The next logical milestone is Stage 2: tooling foundation.

The active milestone is Stage 3: core vertical slice.

The next behavior should harden the core vertical slice with consumer fixtures
and any missing hostile-input tests before moving to `@erris/http`.
