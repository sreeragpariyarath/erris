# @erris/core

> Core runtime error contracts, error catalogs, and normalization engine for
> JavaScript and TypeScript.

[![npm version](https://img.shields.io/npm/v/@erris/core.svg?style=flat-square)](https://www.npmjs.com/package/@erris/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

`@erris/core` provides the foundational primitives for building type-safe,
namespaced application error systems. It enforces immutable error identity
creation, zero-dependency normalization, and strict runtime contracts.

---

## Installation

```bash
# npm
npm install @erris/core

# pnpm
pnpm add @erris/core

# yarn
yarn add @erris/core
```

---

## API Reference & Usage

### 1. `defineErrors(namespace, definitions)`

Creates an immutable catalog of namespaced error factories.

```ts
import { defineErrors } from "@erris/core"

export const UserErrors = defineErrors("user", {
  NOT_FOUND: {
    message: "Requested user account was not found",
  },
  EMAIL_EXISTS: {
    message: "A user account with this email address already exists",
  },
})

// Factory call creates frozen ErrisError instance
const err = UserErrors.NOT_FOUND({ cause: new Error("DB record null") })

console.log(err.code) // "user.not_found" (type: "user.not_found")
console.log(err.message) // "Requested user account was not found"
console.log(err.cause) // Error("DB record null")
```

**TypeScript Invariants & Autocomplete:**

```ts
const error = UserErrors.NOT_FOUND()

error.code
//    ^? "user.not_found"
```

**Guarantees:**

- Error codes are automatically lowercased and prefixed
  (`namespace.key_lowercase`).
- Object structures, catalog keys, and generated factory functions are deeply
  frozen.
- TypeScript preserves exact string literal types for `err.code`.

---

### 2. `combineErrors(...catalogs)`

Safely merges multiple domain error catalogs into a single unified catalog while
validating code and key uniqueness.

```ts
import { defineErrors, combineErrors } from "@erris/core"

const UserErrors = defineErrors("user", {
  NOT_FOUND: { message: "User not found" },
})

const AuthErrors = defineErrors("auth", {
  UNAUTHORIZED: { message: "Unauthorized access" },
})

export const AppErrors = combineErrors(UserErrors, AuthErrors)

// Preserves literal autocomplete types across all combined catalogs
AppErrors.NOT_FOUND()
AppErrors.UNAUTHORIZED()
```

**Guarantees:**

- Prevents duplicate catalog keys or duplicate error code overlaps at runtime.
- Preserves full TypeScript autocompletion and exact literal type unions.

---

### 3. `createNormalizer(options)`

Constructs a resilient normalization function that maps `unknown` thrown values
into guaranteed `ErrisError` occurrences.

```ts
import { createNormalizer, defineErrors } from "@erris/core"

const SystemErrors = defineErrors("system", {
  INTERNAL: { message: "An unexpected internal server error occurred" },
})

const normalize = createNormalizer({
  fallback: SystemErrors.INTERNAL,
  adapters: [], // Add vendor adapters like @erris/adapter-zod or @erris/adapter-prisma
})

try {
  throw new Error("Something went wrong")
} catch (caught) {
  const err = normalize(caught)
  console.log(err.code) // "system.internal"
  console.log(err.cause) // Error("Something went wrong")
}
```

**Guarantees:**

- Passes existing `ErrisError` instances through unchanged.
- Evaluates registered adapters in order until one returns an `ErrisError`.
- Never throws exceptions during normalization (catches adapter failures
  safely).
- Always returns a valid `ErrisError`, attaching unhandled values as `cause`.

---

### 4. `ErrisError` & `isErrisError(value)`

Base class extending standard JavaScript `Error`.

```ts
import { ErrisError, isErrisError } from "@erris/core"

if (isErrisError(err)) {
  console.log(err.code, err.message)
}
```

- **`code`**: Read-only, enumerable string literal representing the error
  identity.
- **`cause`**: Preserves original underlying exceptions without making them
  enumerable.
- **`isErrisError(value)`**: Type guard returning true for valid `ErrisError`
  instances.

---

## Full Example

See [`examples/dogfood-backend`](../../examples/dogfood-backend) for a complete
backend example using `@erris/core` together with HTTP transports and adapters.

---

## Features

- 🛡️ **Zero Runtime Dependencies**: Lightweight core built for Node.js, Bun,
  Deno, and Edge environments.
- ❄️ **Immutable & Frozen**: All factories and instances are frozen to prevent
  tampering.
- 🔒 **Type-Safe Invariants**: Full literal type preservation for error codes.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
