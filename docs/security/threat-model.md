# Threat Model

This document defines the initial security boundaries for Erris itself and its
software supply chain. It will evolve with implementation.

## Assets to protect

- Application secrets and user data
- Internal error causes, stacks, and structured context
- Stable public error identities
- Source and release integrity
- npm package ownership
- GitHub and npm maintainer accounts
- CI identities and release permissions
- Consumer trust in published artifacts

## Trust boundaries

Erris processes values that may be hostile or malformed:

```text
Arbitrary thrown value -> adapter -> normalizer -> ErrisError
                                              -> transport -> public boundary
```

Repository and release boundaries are also security-sensitive:

```text
Contributor code -> pull-request CI -> protected main -> release CI -> npm
```

## Runtime threats

### Sensitive-data disclosure

Causes, stacks, database errors, validation details, tokens, and request data
may contain secrets. Core must not imply that an error object is safe to
serialize. Transports must explicitly select public fields and redact unknown or
internal failures by default.

### Hostile thrown values

JavaScript allows strings, primitives, proxies, circular objects, objects with
throwing getters, and forged error-like values to be thrown. Normalization must
not assume input is a well-behaved `Error`.

### Identity spoofing

Plain objects may imitate Erris fields. `isErrisError()` must balance cross-copy
interoperability with resistance to accidental structural matches. No type guard
can establish that arbitrary application data is trustworthy for public
disclosure.

### Prototype and property hazards

Catalog keys such as `__proto__`, `prototype`, and `constructor` require safe
handling. Catalog creation and composition must use own-property operations and
must not allow prototype mutation.

### Denial of service

Deep cause chains, large metadata, circular structures, and expensive adapter
inspection must not cause unbounded recursion or serialization. Core should
avoid walking arbitrary object graphs.

## Supply-chain threats

- Malicious or compromised direct and transitive dependencies
- Install-time scripts executing on developer or CI machines
- Typosquatted or dependency-confusion packages
- Compromised maintainer, email, GitHub, or npm accounts
- Leaked long-lived publishing tokens
- Mutable or compromised GitHub Actions
- Privileged workflows executing untrusted pull-request code
- Release artifacts that differ from reviewed source
- Version, tag, changelog, and artifact drift

## Required controls

### Dependencies

- Prefer zero runtime dependencies in core.
- Commit and review the lockfile.
- Use deterministic clean installs in CI.
- Review dependency ownership, transitive impact, and install scripts.
- Use dependency review and automated vulnerability alerts.
- Apply an explicit install-script policy when tooling permits.

### Repository

- Protect `main` and release tags.
- Require pull requests and passing checks.
- Enable secret scanning and push protection.
- Pin actions to reviewed full commit SHAs.
- Grant minimum workflow permissions.
- Never expose secrets to untrusted pull-request code.

### Maintainer accounts

- Require unique passwords and phishing-resistant 2FA or passkeys.
- Store recovery codes securely and offline.
- Review active sessions, authorized applications, and tokens regularly.
- Protect maintainer email accounts to the same standard.

### Publishing

- Use npm trusted publishing with short-lived OIDC identity.
- Remove long-lived npm write tokens after trusted publishing is verified.
- Use a protected release environment and explicit approval.
- Test exact packed artifacts before publishing.
- Publish provenance and verify registry attestations.
- Protect release tags and serialize concurrent release attempts.

Provenance proves where and how an artifact was built. It does not prove the
reviewed source is free of malicious behavior.

## Security defaults for transports

- Unknown failures render as a generic internal error.
- Stack and cause are private.
- Structured context is private unless explicitly projected into a public field
  by transport policy.
- A developer message is not automatically a public message.
- Internal failures must not inherit permissive exposure from a nearby code.
- Serialization must create a new output value instead of returning the
  `ErrisError` object directly.

## Incident response outline

If compromise is suspected:

1. Stop releases and preserve relevant evidence.
2. Revoke suspicious sessions, applications, and tokens.
3. Rotate all potentially exposed secrets.
4. Audit trusted-publisher and workflow configuration.
5. Identify affected commits, packages, and versions.
6. Deprecate affected registry versions when appropriate.
7. Build a fix from a verified clean commit.
8. Publish a security advisory and patched release.
9. Document root cause and preventative changes without exposing active
   exploitation details prematurely.

## Deferred decisions

- The exact structured-context type and exposure API
- Cross-realm branding mechanics
- Limits for metadata size and cause depth
- A formal serialized Erris envelope version
- Long-term supported-version policy

These decisions must be resolved before the relevant capability is released.
