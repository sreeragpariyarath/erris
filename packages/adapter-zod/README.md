# `@erris/adapter-zod`

> Zod validation error normalization adapter for
> [Erris](https://github.com/sreeragpariyarath/erris).

[![npm version](https://img.shields.io/npm/v/@erris/adapter-zod.svg?style=flat-square)](https://www.npmjs.com/package/@erris/adapter-zod)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

`@erris/adapter-zod` bridges `ZodError` validation exceptions into
application-level `ErrisError` occurrences while strictly keeping vendor
validation details out of core domain error contracts.

---

## Installation

```bash
# npm
npm install @erris/adapter-zod @erris/core zod

# pnpm
pnpm add @erris/adapter-zod @erris/core zod

# yarn
yarn add @erris/adapter-zod @erris/core zod
```

_Note: `zod` is an optional peer dependency (`^3.0.0 || ^4.0.0`)._

---

## Usage

### 1. Basic Target Mapping

Map all `ZodError` exceptions directly to a domain error (such as
`VALIDATION_FAILED`):

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
  console.log(normalized.cause) // Original ZodError instance
}
```

---

### 2. Custom Classification (`mapError`)

Supply a custom `mapError` callback to classify specific validation failures
based on issue paths or codes:

```ts
const UserErrors = defineErrors("user", {
  INVALID_EMAIL: { message: "Invalid email format" },
  VALIDATION_FAILED: { message: "Validation failed" },
})

const zodAdapter = createZodAdapter({
  mapError(zodError) {
    if (zodError.issues.some((issue) => issue.path.includes("email"))) {
      return UserErrors.INVALID_EMAIL({ cause: zodError })
    }
    return undefined
  },
  target: UserErrors.VALIDATION_FAILED,
})
```

---

## Full Example

See [`examples/dogfood-backend`](../../examples/dogfood-backend) for a complete
backend example using `@erris/adapter-zod` together with `@erris/core` and
`@erris/http`.

---

## Features

- 🌐 **Cross-Realm Safe**: Reliably identifies `ZodError` instances without
  fragile `instanceof` checks.
- 🔗 **Preserves Cause**: Retains the original `ZodError` on the `cause`
  property for downstream logging.
- ⚡ **Zero Core Overhead**: Peer dependency architecture keeps `@erris/core`
  lightweight and independent.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
