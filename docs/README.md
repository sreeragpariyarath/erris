# Erris Documentation

This directory contains the version-controlled design and engineering record for
Erris. Documentation changes follow the same review and CI requirements as code
changes.

## Architecture

- [Project Plan](plan.md)
- [RFC-0002: Runtime Error Contract](rfcs/0002-runtime-error-contract.md)
- [RFC-0001: Original Proposal](../Erris-RFC-0001.md)

## Packages

- [Core Package](../packages/core/README.md)
- [HTTP Package](../packages/http/README.md)
- [Zod Adapter Package](../packages/adapter-zod/README.md)
- [Prisma Adapter Package](../packages/adapter-prisma/README.md)

## Guides

- [Adapter Authoring Guide](guides/adapter-authoring.md)

## Engineering

- [Contributing](../CONTRIBUTING.md)
- [Git Policy](engineering/git-policy.md)
- [Quality Policy](engineering/quality-policy.md)
- [Release Process](engineering/release.md)
- [Tooling](engineering/tooling.md)

## Security

- [Threat Model](security/threat-model.md)
- [Vulnerability Reporting](../SECURITY.md)

## Future documentation

Architecture decision records, migration guides, adapter-authoring guides, and
release procedures will be added only when their corresponding behavior exists.
Empty documentation structures are intentionally avoided.
