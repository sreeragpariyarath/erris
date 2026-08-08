# Contributing to Erris

Thank you for your interest in contributing to Erris! Erris is a
transport-neutral error contract system for JavaScript and TypeScript.

---

## Development Workflow

Before submitting a pull request, ensure your local environment passes all
workspace verification checks:

```bash
# Run the complete verification suite
corepack pnpm check
```

You can also run individual commands:

```bash
corepack pnpm format:check      # Check formatting
corepack pnpm lint              # Run linters
corepack pnpm typecheck         # Verify TypeScript types
corepack pnpm test              # Run test suite
corepack pnpm build             # Build workspace packages
```

---

## Declaring Changesets

For any PR that modifies published package behavior, public APIs, exports, or
dependencies, create a changeset:

```bash
corepack pnpm changeset
```

Follow the prompts to select affected packages (`@erris/core`, `@erris/http`,
`@erris/adapter-zod`, `@erris/adapter-prisma`) and specify bump types (`patch`,
`minor`, `major`).

---

## Security

Security vulnerabilities should be reported privately according to our
[Security Policy](SECURITY.md). Please do not open public issues for security
vulnerabilities.

---

## License

By contributing to Erris, you agree that your contributions will be licensed
under the project's [MIT License](LICENSE).
