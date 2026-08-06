# `@erris/adapter-prisma`

Prisma error normalization adapter for
[Erris](https://github.com/sreeragpariyarath/erris).

`@erris/adapter-prisma` maps Prisma Client exceptions (e.g.
`PrismaClientKnownRequestError` codes like `P2002`, `P2025`) into
application-level `ErrisError` occurrences while keeping database internals out
of core domain error contracts.

## Installation

```bash
pnpm add @erris/adapter-prisma
```

_Note: `@prisma/client` is an optional peer dependency (`^5.0.0 || ^6.0.0`)._

## Usage

```ts
import { createNormalizer, defineErrors } from "@erris/core"
import { createPrismaAdapter } from "@erris/adapter-prisma"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal server error" },
  UNIQUE_CONSTRAINT_FAILED: { message: "Unique constraint failed" },
  NOT_FOUND: { message: "Record not found" },
})

const prismaAdapter = createPrismaAdapter({
  mappings: {
    P2002: AppErrors.UNIQUE_CONSTRAINT_FAILED,
    P2025: AppErrors.NOT_FOUND,
  },
  target: AppErrors.INTERNAL,
})

const normalize = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [prismaAdapter],
})
```

## Features

- Mappings dictionary targeting specific Prisma error codes (`P2002`, `P2025`,
  etc.).
- Custom `mapError` logic for fine-grained classification based on meta
  properties or target fields.
- Cross-realm safe detection of `PrismaClientKnownRequestError` instances.
- Preserves original Prisma error instances on `cause`.
- Zero runtime dependencies in `@erris/core`.
