# @erris/core

Core runtime error contracts for JavaScript and TypeScript.

This package is experimental and not published yet.

## Current Surface

The first implemented surface is intentionally small:

```ts
import { ErrisError, isErrisError } from "@erris/core"

const error = new ErrisError({
  code: "user.email_exists",
  message: "Email already exists",
  cause,
})

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
