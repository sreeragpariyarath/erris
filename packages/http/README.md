# @erris/http

HTTP transport rendering for Erris errors.

This package is experimental and not published yet.

## Current Surface

```ts
import { createHttpTransport } from "@erris/http"
import { combineErrors, defineErrors } from "@erris/core"

const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "Email already exists",
  },
})

const AppErrors = defineErrors("app", {
  INTERNAL: {
    message: "Internal error",
  },
})

const Errors = combineErrors(UserErrors, AppErrors)

const renderHttp = createHttpTransport({
  errors: Errors,
  mappings: {
    "user.email_exists": {
      status: 409,
      title: "Email already exists",
    },
    "app.internal": {
      status: 500,
      title: "Internal server error",
    },
  },
  fallback: {
    status: 500,
    title: "Internal server error",
    code: "internal",
  },
})

const response = renderHttp(UserErrors.EMAIL_EXISTS())
```

`createHttpTransport()`:

- Maps declared Erris codes to HTTP responses
- Requires declared codes to be mapped in TypeScript
- Rejects extra undeclared mappings in TypeScript
- Renders unknown codes through an explicit safe fallback
- Creates a fresh response object
- Does not serialize `cause`, stack, or internal error messages
