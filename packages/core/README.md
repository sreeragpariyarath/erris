# @erris/core

Core runtime error contracts for JavaScript and TypeScript.

This package is experimental and not published yet.

## Current Surface

The implemented surface is intentionally small:

```ts
import {
  combineErrors,
  defineErrors,
  ErrisError,
  isErrisError,
} from "@erris/core"

const UserErrors = defineErrors("user", {
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
const error = AppErrors.EMAIL_EXISTS({ cause })

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
