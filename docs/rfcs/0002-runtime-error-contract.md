# Erris RFC-0002: Runtime Error Contract

## Status

- Status: Accepted for the v0 implementation experiment
- Date: 2026-08-05
- Supersedes: Architectural portions of RFC-0001
- Stability: Architecture accepted; public API remains experimental

## 1. Decision summary

Erris will be designed as a runtime error contract system rather than an error
class utility or framework middleware.

The system contains five responsibilities:

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

The core remains transport-neutral. HTTP status codes, RFC 9457 fields, gRPC
statuses, CLI exit codes, localization, and response exposure policy belong to
transport packages.

## 2. Problem

Production backends repeatedly implement the same error-boundary machinery:

- Application-specific error classes or factory functions
- Vendor-specific `instanceof` and error-code switches
- Unknown-error fallbacks
- Response mapping and redaction
- Inconsistent public shapes across routes and services
- Manually synchronized client types and documentation

Erris aims to eliminate hand-written boundary control flow after an application
has declared its failure policy. It cannot eliminate business decisions about
what a failure means.

## 3. Error catalog

An error catalog is an immutable, composable runtime description of the failure
identities an application intentionally recognizes.

```ts
const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "A user with this email already exists",
  },
  NOT_FOUND: {
    message: "User not found",
  },
})
```

The catalog represents definitions, not occurrences. It provides:

- Stable namespaced identities such as `user.email_exists`
- Typed factories
- A complete error-code union
- Runtime inspection
- Exhaustive transport mapping
- Duplicate detection during composition

Catalogs are local values, not entries in a global mutable registry.

### 3.1 Identity rules

- The namespace and definition key determine the code.
- Codes are stable public identities and must not silently change.
- `combineErrors()` rejects duplicate final codes.
- Human-facing text may evolve without changing identity.
- Catalog definitions and combined catalogs are immutable.

### 3.2 Message semantics

Core definitions use `message`, matching JavaScript's `Error` model.

The message is a developer-facing default. It is not automatically safe for a
public response. Transports own public title, detail, localization, and
redaction policy.

## 4. ErrisError

An `ErrisError` is an immutable runtime occurrence of one failure identity. It
is not a catalog definition, response object, log entry, or trace span.

The initial semantic shape is:

```ts
class ErrisError extends Error {
  readonly code: string
  readonly cause?: unknown
}
```

Required guarantees:

- It behaves as a JavaScript `Error` and preserves a useful stack.
- `code` is stable for the lifetime of the occurrence.
- `message` comes from the selected catalog definition unless intentionally
  overridden by the factory contract.
- `cause` preserves the original failure for internal inspection.
- `cause` and stack are never automatically serialized.
- Normalizing an existing `ErrisError` returns that occurrence unchanged.

Structured occurrence context is intentionally unresolved. Real Prisma and Zod
adapter experiments will determine whether context belongs on `ErrisError`, how
it is typed, and how public exposure is prevented.

Correlation IDs, timestamps, HTTP statuses, severity, logging policy, and
telemetry data do not belong to the core occurrence.

## 5. Normalizer

A normalizer converts an arbitrary JavaScript value into an `ErrisError`.

```ts
normalize(value: unknown): ErrisError
```

It returns an error; it does not throw as its control-flow result. Callers
choose whether to throw or return it:

```ts
throw normalize(cause)
```

Normalizer guarantees:

1. Existing Erris errors pass through unchanged.
2. Configured adapters are evaluated in documented order.
3. The first successful adapter result wins.
4. `null`, `undefined`, primitives, objects, and native errors are accepted.
5. An unmatched value becomes the configured safe fallback.
6. The original value remains available as the internal cause.

`safeNormalize()` and `fromUnknown()` are excluded. Normalization has no success
branch, and accepting `unknown` already covers arbitrary catch values.

## 6. Adapter

The smallest public adapter protocol is the current candidate:

```ts
interface ErrisAdapter {
  readonly name: string
  tryNormalize(value: unknown): ErrisError | undefined
}
```

Reusable vendor adapters classify technical facts. Application configuration
resolves those facts to catalog identities.

For example, Prisma `P2002` means a unique constraint failed. It does not
universally mean `user.email_exists`. A configured Prisma adapter may use
constraint metadata to select an application factory, but the reusable adapter
must not invent business meaning.

Classification and resolution may remain separate internally. They are not
separate public core abstractions in v0.

## 7. Transport

A transport converts an `ErrisError` into a boundary-specific representation.

```text
ErrisError + catalog transport policy -> transport output
```

Transport responsibilities include:

- Exhaustively mapping declared error codes
- Selecting status or transport codes
- Redaction and public exposure
- Localization and public wording
- Producing the transport-specific output shape

An HTTP transport may produce status, headers, and an RFC 9457-compatible body.
A gRPC transport would produce a different result. They share an input contract,
not a universal output type.

Unknown or legacy errors require an explicit safe fallback. Full exhaustive
guarantees apply only when all possible outputs resolve to declared catalog
identities.

## 8. Framework integration

Framework integrations contain glue only:

1. Catch a thrown value.
2. Call the configured normalizer.
3. Render through a transport.
4. Send using the framework API.

They do not define domain errors, contain vendor mappings, decide public
exposure, log automatically, or own business policy.

Framework packages are excluded from the first core experiment. The HTTP
renderer will be exercised directly in a production-style example before
middleware is added.

## 9. Incremental adoption

Existing application error classes are inputs, not competitors that must be
deleted before adoption.

```text
Existing AppError -> legacy adapter --+
Prisma/Zod error -> vendor adapter ----+-> normalizer -> ErrisError
Catalog factory -----------------------+
```

Teams may adopt the boundary first, use catalogs for new modules, and migrate
existing errors gradually. Stronger sealed-catalog guarantees may be added only
after this migration path is tested.

## 10. Candidate v0 surface

The core experiment may expose:

```ts
ErrisError
defineErrors()
combineErrors()
createNormalizer()
isErrisError()
```

The HTTP experiment may expose:

```ts
createHttpTransport()
```

These names are candidates, not frozen promises. They may change before the
first stable release.

## 11. Initial package sequence

Packages are implemented and validated one logical slice at a time:

1. `@erris/core`
2. `@erris/http`
3. `@erris/adapter-prisma`
4. `@erris/adapter-zod`

The workspace may anticipate these packages, but empty package scaffolds will
not be published.

## 12. Non-goals

The v0 experiment excludes:

- Logging and monitoring
- OpenTelemetry and Sentry integration
- Correlation ID generation
- AI features
- Framework middleware and filters
- GraphQL, gRPC, CLI, and queue transports
- OpenAPI and documentation generators
- Localization infrastructure
- A website, dashboard, or hosted service

## 13. Validation criteria

Architecture is considered validated only if a production-style backend shows
that Erris:

- Removes meaningful vendor-switch and response-formatting code
- Preserves or improves readability at throw sites
- Prevents a missing transport mapping at compile time
- Produces safe unknown-error responses
- Can accept an existing application error without a full migration
- Can be integrated without a custom wrapper around most of its API
- Is voluntarily retained after dogfooding

Downloads, generated badges, and package publication alone are not validation.

## 14. Open implementation questions

The implementation experiment must answer:

1. How should structured occurrence context be typed?
2. How should adapter callback completeness be expressed?
3. How should cross-copy and cross-realm error identification work?
4. Should v0 ship both ESM and CommonJS entry points?
5. What is the minimum supported TypeScript version?
6. Is a sealed-catalog mode necessary after incremental adoption?

These questions should be resolved using executable prototypes and real usage,
not additional abstract layers.
