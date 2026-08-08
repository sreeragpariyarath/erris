# Erris

> **Transport-neutral, type-safe error contract infrastructure for JavaScript
> and TypeScript.**

[![npm version](https://img.shields.io/npm/v/@erris/core.svg?style=flat-square)](https://www.npmjs.com/package/@erris/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![JavaScript & TypeScript](https://img.shields.io/badge/JavaScript%20%26%20TypeScript-supported-F7DF1E?style=flat-square)](https://www.typescriptlang.org/)

Every backend eventually invents its own `AppError` class or error handling
helpers. Then Prisma, Zod, and other dependencies introduce their own error
types.

Erris gives your application a single, typed vocabulary for failure across those
boundaries — separating **error identity, normalization, and transport** into
small, composable packages.

---

## The problem

Every backend eventually grows its own collection of error abstractions:

```text
AppError
ApiError
HttpError
ValidationError
DatabaseError
BaseError
```

Then your dependencies introduce another set of errors:

```text
PrismaClientKnownRequestError
ZodError
Node.js errors
...
```

Your application now has to answer the same questions repeatedly:

- How do we define application errors?
- How do we give them stable identities?
- How do we normalize arbitrary thrown values?
- How do we map vendor errors to application errors?
- How do we turn those errors into safe HTTP responses?
- How do we prevent database or validation internals from leaking across
  boundaries?

This logic is usually rebuilt inside individual applications.

**Erris provides a reusable, type-safe foundation for that layer.**

---

## What is Erris?

Erris is a **framework-agnostic error contract system** for JavaScript and
TypeScript.

Its architecture separates four responsibilities:

```text
┌──────────────────┐
│  Error Catalogs  │
│  @erris/core     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Normalization   │
│  @erris/core     │
│  + adapters      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Transport     │
│    @erris/http   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Your framework / runtime │
│ Express · Fastify · Hono │
│ Next.js · Node · Web API │
└──────────────────────────┘
```

The framework is **not** responsible for understanding Prisma, Zod, or your
domain's internal error model.

Erris keeps those concerns separate.

---

## Why Erris?

### 1. Define errors once

Create immutable, namespaced application error catalogs.

```ts
import { defineErrors } from "@erris/core"

const UserErrors = defineErrors("user", {
  NOT_FOUND: {
    message: "Requested user account was not found",
  },
  EMAIL_EXISTS: {
    message: "Email address already registered",
  },
})
```

The resulting error identity is stable and type-safe:

```ts
UserErrors.NOT_FOUND().code
// ^? "user.not_found"
```

---

### 2. Normalize external errors

Third-party libraries should not become your application's error contract.

```ts
import { createNormalizer } from "@erris/core"
import { createZodAdapter } from "@erris/adapter-zod"
import { createPrismaAdapter } from "@erris/adapter-prisma"

const normalize = createNormalizer({
  fallback: SystemErrors.INTERNAL,
  adapters: [
    createZodAdapter({
      target: UserErrors.VALIDATION_FAILED,
    }),
    createPrismaAdapter({
      mappings: {
        P2002: UserErrors.EMAIL_EXISTS,
        P2025: UserErrors.NOT_FOUND,
      },
      target: SystemErrors.INTERNAL,
    }),
  ],
})
```

Now vendor-specific exceptions can be translated into application-level
`ErrisError` occurrences without coupling your core domain contracts to those
vendors.

---

### 3. Render errors at the transport boundary

`@erris/http` converts normalized errors into structured HTTP responses using
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457).

```ts
import { createHttpTransport } from "@erris/http"

const renderHttp = createHttpTransport({
  errors: AppErrors,
  mappings: {
    "user.not_found": {
      status: 404,
      title: "User Not Found",
    },
    "user.email_exists": {
      status: 409,
      title: "Email Conflict",
    },
    "system.internal": {
      status: 500,
      title: "Internal Server Error",
    },
  },
  fallback: {
    status: 500,
    title: "Internal Server Error",
    code: "system.internal",
  },
})
```

The result is transport data your framework or runtime can send:

```ts
const response = renderHttp(UserErrors.NOT_FOUND())

// response.body:
// {
//   "title": "User Not Found",
//   "status": 404,
//   "code": "user.not_found"
// }
```

Erris produces the contract at the boundary and lets your application decide how
to deliver it.

---

## Package ecosystem

Erris is intentionally split into small packages.

| Package                                                                        | Purpose                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [`@erris/core`](https://www.npmjs.com/package/@erris/core)                     | Error catalogs, `ErrisError`, and normalization         |
| [`@erris/http`](https://www.npmjs.com/package/@erris/http)                     | RFC 9457 HTTP response rendering                        |
| [`@erris/adapter-zod`](https://www.npmjs.com/package/@erris/adapter-zod)       | Normalizes `ZodError` into application errors           |
| [`@erris/adapter-prisma`](https://www.npmjs.com/package/@erris/adapter-prisma) | Normalizes Prisma Client errors into application errors |

Install only what you need.

```bash
npm install @erris/core
```

For an HTTP application:

```bash
npm install @erris/core @erris/http
```

With vendor adapters:

```bash
npm install @erris/core @erris/http @erris/adapter-zod @erris/adapter-prisma
```

---

## Full Example

See [`examples/dogfood-backend`](examples/dogfood-backend) for a complete
backend example demonstrating how the Erris packages work together.

---

## Core concepts

### Error catalogs

Application errors are declared explicitly as immutable, namespaced catalogs.

```ts
const AuthErrors = defineErrors("auth", {
  INVALID_TOKEN: {
    message: "Invalid authentication token",
  },
})
```

This produces a stable identity:

```text
auth.invalid_token
```

The identity is part of the application contract rather than an incidental
exception message.

### Normalization

`createNormalizer()` accepts arbitrary thrown values and produces a guaranteed
`ErrisError`.

Adapters are evaluated in order, and the configured fallback provides a safe
result when nothing matches.

### Transports

Transports convert normalized errors into boundary-specific representations.

The current HTTP transport produces structured RFC 9457-compatible response
data.

### Framework delivery

Erris intentionally does not own framework middleware.

The application catches the error, normalizes it, renders it, and sends the
result through whatever framework or runtime it already uses.

---

## Design principles

### Explicit over magic

Error identities and transport mappings are declared explicitly and checked by
TypeScript.

### Stable error identity

Errors use namespaced codes such as:

```text
user.not_found
auth.invalid_token
system.internal
```

The code represents the application's failure identity rather than the vendor
that happened to produce the original exception.

### Transport neutral

The core contract does not depend on HTTP.

HTTP rendering lives in `@erris/http`, keeping transport concerns outside the
core package.

### Safe by default

Underlying exceptions and stack traces can remain available through `cause` for
internal handling without being serialized into public HTTP responses by
default.

### Small packages

The core package has no runtime dependencies. Integrations are isolated into
separate packages so applications can install only the pieces they need.

### Incremental adoption

Erris does not require replacing an application's existing error system in one
step. Existing errors can be normalized through adapters and migrated
incrementally.

---

## What Erris is not

Erris deliberately stays out of several areas.

It is not:

- a logging platform
- a monitoring service
- a tracing system
- an error dashboard
- an AI error explainer
- a Sentry replacement
- a hosted error-management service

Those concerns belong to other layers of the application stack.

---

## Current status

Erris is currently **pre-1.0**.

The architecture and public APIs are still being validated through real-world
usage, so APIs may evolve before the project reaches a stable 1.0 release.

The current published packages are:

- `@erris/core`
- `@erris/http`
- `@erris/adapter-zod`
- `@erris/adapter-prisma`

The project is intentionally validating the core error-contract model before
expanding into a larger integration ecosystem.

---

## Documentation

- [Documentation Index](docs/README.md)
- [Runtime Error Contract — RFC 0002](docs/rfcs/0002-runtime-error-contract.md)
- [Adapter Authoring Guide](docs/guides/adapter-authoring.md)
- [Threat Model](docs/security/threat-model.md)
- [Security Policy](SECURITY.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## Contributing

Erris is still validating its architecture.

Small, focused proposals and executable evidence are more valuable than broad
feature additions at this stage.

For significant behavior or public API changes, open a discussion or issue
before implementation and explain:

1. The problem being solved.
2. Why the current design does not solve it.
3. The smallest observable behavior that would validate the proposal.
4. Compatibility, security, and migration consequences.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project workflow.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
