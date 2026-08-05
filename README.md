# Erris

Applications already have a vocabulary for failure. Erris turns that
vocabulary into executable, type-safe infrastructure.

Erris is a transport-neutral error contract system for JavaScript and
TypeScript. It is being designed around four responsibilities:

```text
Error catalog -> normalization -> transport -> framework delivery
```

- Catalogs declare stable application failure identities.
- Normalizers convert arbitrary thrown values into `ErrisError` occurrences.
- Transports render those occurrences for boundaries such as HTTP.
- Framework integrations only catch, render, and send.

## Project status

Erris is in the pre-implementation design stage. There is no installable
package yet, and the public API is not stable.

The first implementation milestone will validate a small vertical slice:

1. `@erris/core`
2. `@erris/http`
3. A typed adapter protocol
4. Prisma and Zod adapters after the protocol survives core testing
5. Dogfooding in a production-style backend before ecosystem expansion

## Design principles

- Explicit policy over hidden magic
- Stable, namespaced error identities
- Immutable and composable catalogs
- Transport-neutral core semantics
- Safe output by default
- Zero runtime dependencies in core when practical
- Incremental adoption of existing error systems
- Small, independently testable releases

## Non-goals

Erris is not a logger, monitoring service, tracing system, AI error explainer,
or Sentry replacement. Framework middleware, additional transports, and
observability integrations are downstream work, not core responsibilities.

## Documentation

- [Documentation index](docs/README.md)
- [Project plan](docs/plan.md)
- [Current architecture proposal](docs/rfcs/0002-runtime-error-contract.md)
- [Original project RFC](Erris-RFC-0001.md)
- [Git policy](docs/engineering/git-policy.md)
- [Quality policy](docs/engineering/quality-policy.md)
- [Threat model](docs/security/threat-model.md)
- [Security reporting](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Development

Repository tooling and package commands will be introduced in the next
milestone. No package will be published until CI, package-consumer tests,
trusted publishing, and release protections are in place.
