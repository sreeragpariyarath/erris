# Erris RFC-0001

## Working Draft

> Historical note: This document records the original Erris proposal. The
> current implementation architecture is defined in
> [RFC-0002](docs/rfcs/0002-runtime-error-contract.md). RFC-0001 is retained
> so the project's design evolution remains visible.

> Status: Draft Version: 0.1.0 Author: Project Erris Goal: Validate
> whether Erris solves a real developer pain before expanding into an
> ecosystem.

------------------------------------------------------------------------

# 1. Vision

Erris is a framework-agnostic error contract and normalization library
for JavaScript and TypeScript.

Erris is **not**:

-   an Express middleware
-   an error logger
-   an observability platform
-   an AI error explainer
-   a Sentry replacement

Erris aims to provide one consistent way to define, throw, normalize and
transport application errors.

------------------------------------------------------------------------

# 2. Problem Statement

Every backend project eventually creates:

-   AppError
-   ApiError
-   HttpError
-   createError()
-   BaseError

Every framework and library exposes different error types.

Examples:

-   PrismaClientKnownRequestError
-   AxiosError
-   MongoServerError
-   Node SystemError
-   ZodError
-   JWT errors

Every project manually maps these into application-specific HTTP
responses.

This logic is duplicated across thousands of repositories.

------------------------------------------------------------------------

# 3. Goals

-   Small TypeScript-first library
-   Zero runtime dependencies (preferred)
-   Tree-shakeable
-   Framework agnostic
-   Adapter based
-   Excellent DX
-   Strong typing
-   RFC 9457 compatible through adapters

------------------------------------------------------------------------

# 4. Non Goals

-   Logging
-   Monitoring
-   AI diagnostics
-   Crash reporting
-   Error dashboards
-   Distributed tracing
-   Vendor lock-in

------------------------------------------------------------------------

# 5. Core Concepts

## Application Errors

Errors intentionally defined by the application.

Example:

``` ts
const Errors = defineErrors({
  USER_EXISTS: {
    status: 409,
    title: "User already exists"
  }
})

throw Errors.USER_EXISTS()
```

## External Errors

Errors coming from third-party libraries.

Examples:

-   Prisma
-   Axios
-   Node
-   Mongo
-   Redis
-   Zod

These should be normalized.

------------------------------------------------------------------------

# 6. Design Principles

1.  Explicit over magic
2.  Strong typing
3.  Immutable definitions
4.  Small surface area
5.  Adapter architecture
6.  Framework independence

------------------------------------------------------------------------

# 7. Proposed API

``` ts
const Errors = defineErrors({
  USER_EXISTS: {
    status: 409,
    title: "User already exists"
  },
  INVALID_EMAIL: {
    status: 400,
    title: "Invalid email"
  }
})

throw Errors.USER_EXISTS()

const normalized = normalize(error)

isErrisError(error)
```

Target exports:

-   defineErrors()
-   normalize()
-   isErrisError()

------------------------------------------------------------------------

# 8. Proposed Internal Shape

``` ts
interface ErrisError {
  code: string
  status: number
  title: string
  message: string
  cause?: unknown
}
```

Deliberately minimal.

Future metadata belongs in adapters.

------------------------------------------------------------------------

# 9. Package Layout

Phase 1:

-   @erris/core

Future:

-   @erris/express
-   @erris/problem
-   @erris/prisma
-   @erris/zod
-   @erris/axios

------------------------------------------------------------------------

# 10. Example Flow

Prisma

↓

normalize()

↓

ErrisError

↓

RFC9457 Adapter

↓

HTTP Response

------------------------------------------------------------------------

# 11. Example

``` ts
const Errors = defineErrors({
  USER_EXISTS: {
    status: 409,
    title: "User already exists"
  }
})

async function createUser() {
  throw Errors.USER_EXISTS()
}
```

------------------------------------------------------------------------

# 12. Why Not Just AppError?

Today every project invents its own implementation.

Erris attempts to provide a reusable, typed foundation instead of
duplicated boilerplate.

------------------------------------------------------------------------

# 13. Open Questions

These are intentionally unanswered.

1.  Will developers replace their own AppError?
2.  Is defineErrors() the correct primitive?
3.  Should normalize() live in core?
4.  Should HTTP concepts remain outside core?
5.  Which fields are truly universal?

------------------------------------------------------------------------

# 14. Success Criteria

Phase 1 is successful if developers independently choose Erris over
their own AppError implementation.

Success is NOT:

-   becoming a standard
-   replacing Sentry
-   replacing OpenTelemetry

------------------------------------------------------------------------

# 15. Six Month Roadmap

## Month 1

-   API finalized
-   Core package
-   Documentation

## Month 2

-   Dogfood in one production app
-   DX improvements

## Month 3

-   Express adapter
-   RFC9457 adapter

## Month 4

-   Prisma adapter
-   Zod adapter

## Month 5

-   Community feedback
-   API stabilization

## Month 6

Decision point:

-   Continue
-   Pivot
-   Archive

------------------------------------------------------------------------

# 16. Risks

-   Existing custom AppError implementations may be "good enough".
-   Existing standards may reduce adoption.
-   Scope creep into logging/monitoring.
-   Too many adapters increase maintenance.

------------------------------------------------------------------------

# 17. Out of Scope

-   CLI
-   Website
-   VS Code extension
-   AI
-   Hosted service
-   Analytics

------------------------------------------------------------------------

# 18. Validation Plan

Before adding features:

1.  Replace current AppError in one real project.
2.  Compare code readability.
3.  Interview 20 backend developers.
4.  Measure installation and retention.

No expansion until this hypothesis is validated.
