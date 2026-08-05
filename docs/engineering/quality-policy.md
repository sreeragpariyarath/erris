# Quality Policy

Quality gates exist to protect behavior, types, packages, and releases. A
green source test suite is necessary but insufficient for a library.

## Definition of done

A behavior change is complete only when:

- Acceptance criteria are explicit.
- Runtime tests cover the observable behavior.
- Type tests cover relevant inference and rejection behavior.
- Security and serialization implications are considered.
- Public documentation is updated.
- Formatting, lint, typecheck, tests, build, and package checks pass.
- The packed artifact works in representative consumer fixtures.
- The diff contains no unrelated changes.

The build milestone will provide one local command that runs the complete
verification sequence.

## Test layers

### Runtime unit tests

Core tests will cover:

- JavaScript `Error` behavior and cause preservation
- Catalog identity, immutability, and factory behavior
- Namespaces and duplicate detection
- Catalog composition
- Type guard behavior
- Ordered adapter matching and short-circuiting
- Primitive, object, `null`, and `undefined` normalization
- Safe fallback behavior
- Hostile objects, throwing getters, and unusual property names

Transport tests will cover:

- Exhaustive mappings
- Correct boundary-specific representation
- Safe defaults for internal and unknown errors
- Non-disclosure of stack, cause, and internal context
- Circular and non-serializable internal values

### Type tests

Type tests are first-class product tests. They will verify:

- Literal error-code inference
- Typed factories
- Catalog union preservation after composition
- Compile-time rejection of unknown definitions
- Missing and extra transport mappings
- JavaScript usability without TypeScript annotations
- Supported TypeScript-version behavior

### Integration tests

Integration tests will exercise configured adapters, normalizers, and
transports together. Real Prisma and Zod fixtures will be added only with their
adapter packages.

### Package-consumer tests

CI will build and pack each publishable workspace, inspect the tarball, install
it into temporary consumer fixtures, and test supported import styles and
generated declarations. These tests run against the tarball, not the source
workspace.

Tools such as `publint` and `arethetypeswrong` may be included to validate
package exports and declaration resolution.

## Compatibility matrix

The initial target is maintained Node.js LTS lines, beginning with Node 22 and
24. Exact TypeScript minimum support and ESM/CommonJS publication are open
implementation decisions and must be backed by CI before being promised.

Core will avoid Node-specific APIs unless a documented requirement proves
necessary. Browser, Bun, and Deno compatibility will not be advertised without
dedicated consumer tests.

## Coverage

Coverage is a diagnostic, not a substitute for assertions. Critical branches
must be tested even if a numeric threshold is met. A threshold will be chosen
after the first vertical slice establishes a meaningful baseline; arbitrary
100 percent coverage is not a v0 goal.

## CI requirements

CI will eventually include:

- Minimal read-only permissions for ordinary checks
- Concurrency cancellation for superseded pull-request runs
- Explicit timeouts
- Formatting, lint, typecheck, runtime tests, and type tests
- Supported Node and TypeScript matrices
- Build and packed-consumer verification
- Dependency review
- Workflow validation
- Separate protected release permissions

Required check names must remain stable enough for repository rulesets.

## Release verification

Before publication, the protected release workflow must:

1. Check out the reviewed release commit.
2. Install exactly from the lockfile.
3. Run the complete verification suite.
4. Build and pack publishable workspaces.
5. Test the exact tarballs in consumer fixtures.
6. Verify package versions agree with the intended release.
7. Publish through npm trusted publishing with provenance.
8. Avoid long-lived write tokens.

A release is not successful until registry metadata and the installed artifact
have been verified.
