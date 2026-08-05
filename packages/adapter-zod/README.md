# `@erris/adapter-zod`

Zod validation error normalization adapter for
[Erris](https://github.com/sreeragpariyarath/erris).

`@erris/adapter-zod` bridges `ZodError` exceptions into application-level
`ErrisError` occurrences while strictly keeping vendor validation details out of
core domain contracts.

## Installation

```bash
pnpm add @erris/adapter-zod
```

_Note: `zod` is an optional peer dependency (`^3.0.0 || ^4.0.0`)._

## Usage

```ts
import { createNormalizer, defineErrors } from "@erris/core"
import { createZodAdapter } from "@erris/adapter-zod"
import { z } from "zod"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal server error" },
  VALIDATION_FAILED: { message: "Validation error" },
})

const zodAdapter = createZodAdapter({
  target: AppErrors.VALIDATION_FAILED,
})

const normalize = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [zodAdapter],
})

try {
  z.string().parse(123)
} catch (err) {
  const normalized = normalize(err)
  console.log(normalized.code) // "app.validation_failed"
  console.log(normalized.cause) // original ZodError instance
}
```

### Custom Mapping

You can supply a `mapError` function for fine-grained classification based on
issue paths or codes:

```ts
const zodAdapter = createZodAdapter({
  mapError(zodError) {
    if (zodError.issues.some((issue) => issue.path.includes("email"))) {
      return UserErrors.INVALID_EMAIL({ cause: zodError })
    }
    return undefined
  },
  target: AppErrors.VALIDATION_FAILED,
})
```

## Features

- Cross-realm safe detection of `ZodError` instances.
- Preserves the original `ZodError` on the `cause` property.
- Zero extra dependencies in `@erris/core`.
