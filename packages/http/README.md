# @erris/http

> RFC 9457 compliant HTTP response rendering for Erris errors.

[![npm version](https://img.shields.io/npm/v/@erris/http.svg?style=flat-square)](https://www.npmjs.com/package/@erris/http)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

`@erris/http` translates normalized `ErrisError` occurrences into structured,
type-checked HTTP responses adhering to the **RFC 9457 (Problem Details for HTTP
APIs)** specification.

---

## Installation

```bash
# npm
npm install @erris/http @erris/core

# pnpm
pnpm add @erris/http @erris/core

# yarn
yarn add @erris/http @erris/core
```

---

## API Reference & Usage

### `createHttpTransport(options)`

Constructs a type-checked HTTP transport function that converts an `ErrisError`
into an `{ status, headers, body }` response payload.

```ts
import { createHttpTransport } from "@erris/http"
import { defineErrors, combineErrors } from "@erris/core"

// 1. Define catalogs
const UserErrors = defineErrors("user", {
  NOT_FOUND: { message: "User account not found" },
  EMAIL_EXISTS: { message: "Email already registered" },
})

const SystemErrors = defineErrors("system", {
  INTERNAL: { message: "Internal server error" },
})

const AppErrors = combineErrors(UserErrors, SystemErrors)

// 2. Configure HTTP transport mappings
export const renderHttp = createHttpTransport({
  errors: AppErrors,
  mappings: {
    "user.not_found": {
      status: 404,
      title: "User Not Found",
      detail: "The requested user account identifier does not exist.",
    },
    "user.email_exists": {
      status: 409,
      title: "Email Conflict",
      detail: "A user account with this email address already exists.",
      headers: { "x-error-reason": "duplicate_email" },
    },
    "system.internal": {
      status: 500,
      title: "Internal Error",
      detail: "An unexpected internal server error occurred.",
    },
  },
  fallback: {
    status: 500,
    title: "Internal Server Error",
    detail: "An unexpected error occurred.",
    code: "system.internal",
  },
})

// 3. Render normalized error to HTTP response
const response = renderHttp(UserErrors.NOT_FOUND())
```

---

## Actual HTTP JSON Response Output

The `response.body` rendered by `renderHttp()` produces the exact serialized RFC
9457 JSON payload received by HTTP client applications:

```json
{
  "title": "User Not Found",
  "status": 404,
  "detail": "The requested user account identifier does not exist.",
  "code": "user.not_found"
}
```

---

## Full Example

See [`examples/dogfood-backend`](../../examples/dogfood-backend) for a complete
backend example integrating `@erris/http` with Express and database adapters.

---

## Features

- 📜 **RFC 9457 Compliant**: Standardized problem details format (`title`,
  `status`, `detail`, `code`, `type`).
- 🎯 **Type-Safe Mapping Coverage**: TypeScript enforces that every declared
  error code in your catalog has a corresponding HTTP mapping.
- 🛡️ **Safe by Default**: Automatically strips sensitive internal data (`cause`,
  stack traces, SQL queries) from public HTTP payloads.
- ⚡ **Framework Agnostic**: Works seamlessly with Express, Fastify, Hono,
  Next.js, Web APIs (`Response`), Koa, or native Node.js HTTP servers.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
