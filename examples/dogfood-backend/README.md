# `@erris/example-dogfood-backend`

Production-style backend example demonstrating dogfooding of Erris packages at
real service boundaries.

## Architectural Overview

This example demonstrates how Erris eliminates repeated backend error machinery:

```text
Request ➔ Route Handler ➔ (throws ZodError | PrismaError | ErrisError | Error)
                                          │
                                          ▼
                                   normalize(error)
                                          │
                                          ▼
                                 renderHttp(normalized)
                                          │
                                          ▼
                                 Safe RFC 7807 Response
```

## Structure

- **`src/errors.ts`**: Declares `UserErrors`, `OrderErrors`, and `SystemErrors`
  catalogs; initializes `createNormalizer` with `@erris/adapter-zod` and
  `@erris/adapter-prisma`.
- **`src/transport.ts`**: Initializes `createHttpTransport` mapping catalog
  error codes to HTTP status codes and detail messages.
- **`src/app.ts`**: Implements route boundaries (`POST /api/users`,
  `GET /api/users/:id`, `POST /api/orders`, `GET /api/crash`).
- **`src/app.test.ts`**: Integration test suite verifying HTTP responses for
  successes, validation failures, database errors, and unknown crashes.
