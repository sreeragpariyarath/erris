# @erris/core

Core runtime error contracts for JavaScript and TypeScript.

This package is experimental and not published yet.

## Current Surface

The implemented surface is intentionally small:

```ts
import {
  combineErrors,
  createNormalizer,
  defineErrors,
  ErrisError,
  isErrisError,
} from "@erris/core"

const UserErrors = defineErrors("user", {
  INTERNAL: {
    message: "Internal error",
  },
  EMAIL_EXISTS: {
    message: "Email already exists",
  },
})

const AuthErrors = defineErrors("auth", {
  INVALID_TOKEN: {
    message: "Invalid token",
  },
})

const AppErrors = combineErrors(UserErrors, AuthErrors)
const normalize = createNormalizer({
  fallback: UserErrors.INTERNAL,
  adapters: [],
})

const error = AppErrors.EMAIL_EXISTS({ cause })
const normalized = normalize(caughtValue)

isErrisError(error)
```

`ErrisError`:

- Extends JavaScript `Error`
- Preserves `message`, stack, and optional `cause`
- Adds a stable `code`
- Freezes the occurrence after construction
- Does not make `cause` or stack enumerable

Cross-copy and cross-realm identification are intentionally unresolved. The
initial `isErrisError()` guard identifies errors created by the same package
instance.

`defineErrors()`:

- Creates immutable catalog objects
- Creates immutable error factories
- Derives namespaced codes such as `user.email_exists`
- Preserves literal code types in TypeScript
- Rejects empty and prototype-polluting namespace or definition keys

`combineErrors()`:

- Composes multiple catalogs into one immutable catalog
- Preserves the original factory functions
- Preserves literal code types across catalogs
- Rejects duplicate catalog keys and duplicate error codes

`createNormalizer()`:

- Converts `unknown` values into `ErrisError` occurrences
- Passes existing Erris errors through unchanged
- Evaluates adapters in configured order
- Uses the first successful adapter result
- Falls back safely with the original value as `cause`
- Does not throw when an adapter throws
