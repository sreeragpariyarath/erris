# Adapter Authoring Guide

This guide explains how to author custom error adapters for Erris.

An adapter converts external, vendor-specific, or legacy error values into typed
`ErrisError` occurrences through explicit configuration.

## The `ErrisAdapter` Protocol

In `@erris/core`, an adapter is an object implementing the `ErrisAdapter`
interface:

```ts
export interface ErrisAdapter {
  readonly name: string
  tryNormalize(value: unknown): ErrisError | undefined
}
```

When `createNormalizer()` encounters a value that is not already an
`ErrisError`, it iterates through its configured `adapters` in array order:

1. The normalizer calls `adapter.tryNormalize(value)`.
2. If the adapter recognizes `value` and returns an `ErrisError`, normalization
   succeeds immediately.
3. If the adapter returns `undefined`, the normalizer proceeds to the next
   adapter.
4. If no adapter matches, the normalizer invokes the configured `fallback` error
   factory.

## Authoring Principles

### 1. Structural Duck-Typing Over Strict `instanceof`

Avoid relying solely on `instanceof VendorError`. In modern JavaScript runtimes
(micro-frontends, worker threads, multiple `node_modules` versions, bundled
serverless functions), `instanceof` checks often fail across realm boundaries.

Prefer structural property checks alongside name inspection:

```ts
function isMyVendorError(value: unknown): value is MyVendorErrorLike {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as { name?: unknown; code?: unknown }
  return (
    candidate.name === "MyVendorError" && typeof candidate.code === "string"
  )
}
```

### 2. Separate Vendor Facts from Domain Meaning

An adapter should not hardcode business policy. Vendor facts (e.g., Prisma
`P2002` or Zod issues) should be mapped explicitly to application catalog
factories supplied by the caller.

Provide a dictionary mapping option or a custom mapper callback:

```ts
export interface MyAdapterOptions {
  readonly target?: ErrisErrorFactory<string>
  readonly mappings?: Readonly<Record<string, ErrisErrorFactory<string>>>
  readonly mapError?: (error: MyVendorErrorLike) => ErrisError | undefined
}
```

### 3. Always Preserve Lineage (`cause`)

Attach the original caught error object as the `cause` when constructing
`ErrisError` instances:

```ts
return targetFactory({ cause: value })
```

This guarantees that logger and observability pipelines retain full access to
stack traces and vendor-specific diagnostic context without exposing internal
details to public boundaries.

### 4. Non-Crashing `tryNormalize`

An adapter's `tryNormalize` method must return `undefined` for values it does
not handle. It should not throw errors when inspecting unexpected primitives or
objects.

## Step-by-Step Example: Legacy `AppError` Adapter

Here is a complete example adapter for a legacy application `CustomError`
object:

```ts
import {
  type ErrisAdapter,
  type ErrisError,
  type ErrisErrorFactory,
} from "@erris/core"

export interface LegacyAdapterOptions {
  readonly mappings: Readonly<Record<string, ErrisErrorFactory<string>>>
  readonly fallback: ErrisErrorFactory<string>
}

export function createLegacyAdapter(
  options: LegacyAdapterOptions,
): ErrisAdapter {
  return {
    name: "legacy-app-error",
    tryNormalize(value: unknown): ErrisError | undefined {
      if (!isLegacyAppError(value)) {
        return undefined
      }

      const mappedFactory = options.mappings[value.code]
      if (mappedFactory !== undefined) {
        return mappedFactory({ cause: value })
      }

      return options.fallback({ cause: value })
    },
  }
}

function isLegacyAppError(value: unknown): value is { code: string } {
  if (typeof value !== "object" || value === null) {
    return false
  }
  return (
    "code" in value && typeof (value as { code?: unknown }).code === "string"
  )
}
```

## Checklist for Production Adapters

- [ ] Implements `ErrisAdapter` interface with a descriptive `name`.
- [ ] Safe structural type guard that handles `null`, primitives, and
      cross-realm values.
- [ ] Accepts explicit user configuration (fact-to-policy mappings or target
      factory).
- [ ] Attaches the original caught value as `cause`.
- [ ] Zero extra runtime dependencies in `@erris/core`.
- [ ] Full unit tests covering matching, non-matching, custom mapping, and cause
      preservation.
- [ ] Verified with `publint` and `@arethetypeswrong/cli` if published as an npm
      package.
