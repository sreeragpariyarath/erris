# `@erris/adapter-prisma`

> Prisma error normalization adapter for
> [Erris](https://github.com/sreeragpariyarath/erris).

[![npm version](https://img.shields.io/npm/v/@erris/adapter-prisma.svg?style=flat-square)](https://www.npmjs.com/package/@erris/adapter-prisma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

`@erris/adapter-prisma` maps Prisma Client exceptions (such as
`PrismaClientKnownRequestError` codes like `P2002`, `P2025`) into
application-level `ErrisError` occurrences while keeping database internals out
of core domain error contracts.

---

## Installation

```bash
# npm
npm install @erris/adapter-prisma @erris/core @prisma/client

# pnpm
pnpm add @erris/adapter-prisma @erris/core @prisma/client

# yarn
yarn add @erris/adapter-prisma @erris/core @prisma/client
```

_Note: `@prisma/client` is an optional peer dependency
(`^5.0.0 || ^6.0.0 || ^7.0.0`)._

---

## Common Prisma Error Code Reference

| Code        | Prisma Exception Meaning                                    |
| :---------- | :---------------------------------------------------------- |
| **`P2002`** | Unique constraint violation (e.g. duplicate email/username) |
| **`P2025`** | Record to update or delete was not found                    |
| **`P2003`** | Foreign key constraint failed on field                      |

---

## Usage

### 1. Error Code Mappings Dictionary

Map specific Prisma error codes (`P2002`, `P2025`, etc.) to domain error
factories:

```ts
import { createNormalizer, defineErrors } from "@erris/core"
import { createPrismaAdapter } from "@erris/adapter-prisma"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal server error" },
  UNIQUE_CONSTRAINT_FAILED: { message: "Unique constraint failed" },
  RECORD_NOT_FOUND: { message: "Record not found" },
})

const prismaAdapter = createPrismaAdapter({
  mappings: {
    P2002: AppErrors.UNIQUE_CONSTRAINT_FAILED, // Unique constraint violation
    P2025: AppErrors.RECORD_NOT_FOUND, // Record to update/delete not found
  },
  target: AppErrors.INTERNAL,
})

const normalize = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [prismaAdapter],
})
```

---

### 2. Custom Classification (`mapError`)

Supply a custom `mapError` callback to inspect Prisma `meta` properties (such as
target fields):

```ts
const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: { message: "Email already registered" },
  RECORD_NOT_FOUND: { message: "User not found" },
})

const prismaAdapter = createPrismaAdapter({
  mapError(prismaError) {
    if (
      prismaError.code === "P2002" &&
      Array.isArray(prismaError.meta?.target) &&
      prismaError.meta.target.includes("email")
    ) {
      return UserErrors.EMAIL_EXISTS({ cause: prismaError })
    }
    return undefined
  },
  target: UserErrors.RECORD_NOT_FOUND,
})
```

---

## Full Example

See [`examples/dogfood-backend`](../../examples/dogfood-backend) for a complete
backend example using `@erris/adapter-prisma` together with `@erris/core` and
`@erris/http`.

---

## Features

- 🗄️ **Prisma Code Dictionary**: Direct mapping of known request codes (`P2002`,
  `P2025`, `P2003`, etc.).
- 🌐 **Cross-Realm Safe**: Structural duck-typing detection of
  `PrismaClientKnownRequestError`.
- 🔗 **Preserves Cause**: Retains the original Prisma error instance on `cause`.
- ⚡ **Zero Core Overhead**: No runtime database dependencies added to
  `@erris/core`.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
