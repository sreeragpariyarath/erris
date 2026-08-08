# Erris Project Plan

## Purpose

Erris is a transport-neutral error contract system for JavaScript and
TypeScript.

The project exists to eliminate repeated hand-written backend error-boundary
machinery: custom `AppError` utilities, vendor-specific catch blocks,
unknown-error fallbacks, response mapping, redaction decisions, and manually
synchronized client error contracts.

The core flow is:

```text
Declare failure policy once ──> Normalize any thrown value ──> Render safely at boundaries
```

---

## Workspace Architecture

```text
Catalog factories ─────────────────────────────┐
                                               │
Unknown values ──> Configured Normalizer ──> ErrisError occurrence
                                               │
                                               ▼
                                        Transport Renderer
                                               │
                                               ▼
                                        Framework Delivery
```

### Published Workspace Packages

1. **`@erris/core`**: Core `ErrisError` class, `defineErrors()`,
   `combineErrors()`, `createNormalizer()`, `isErrisError()`, and typed adapter
   protocols.
2. **`@erris/http`**: RFC 9457 compliant Problem Details HTTP response rendering
   (`createHttpTransport()`).
3. **`@erris/adapter-zod`**: Normalization adapter for `ZodError` exceptions.
4. **`@erris/adapter-prisma`**: Normalization adapter for
   `PrismaClientKnownRequestError` database codes (`P2002`, `P2025`, etc.).

---

## Roadmap & Implementation Status

- [x] **Stage 1: Project Foundation** - Architecture RFCs, git policies,
      security threat model, contributor guidelines.
- [x] **Stage 2: Tooling Foundation** - TypeScript monorepo workspace, ESLint,
      Prettier, Vitest, publint, attw, CI workflows.
- [x] **Stage 3: Core Vertical Slice** - `@erris/core` package (`ErrisError`,
      `defineErrors`, `combineErrors`, `createNormalizer`).
- [x] **Stage 4: HTTP Transport** - `@erris/http` package (RFC 9457 problem
      details response rendering).
- [x] **Stage 5: Adapter Protocols** - `@erris/adapter-zod` and
      `@erris/adapter-prisma` normalization adapters.
- [x] **Stage 6: Dogfooding** - Production-style backend example
      (`examples/dogfood-backend`).
- [x] **Stage 7: Release Automation** - Automated Changeset release workflows
      with npm OIDC Trusted Publishing.
- [ ] **Stage 8: Ecosystem Expansion** - Framework middleware (Express, Fastify,
      Hono) and additional validation/DB adapters (Valibot, Kysely).

---

## License

[MIT](../LICENSE) © Sreerag Pariyarath
