import type { ErrisAdapter, ErrisError, ErrisErrorFactory } from "@erris/core"

export interface PrismaKnownRequestErrorLike {
  readonly name: string
  readonly code: string
  readonly clientVersion?: string
  readonly meta?: Record<string, unknown>
}

export type PrismaErrorMapper = (
  error: PrismaKnownRequestErrorLike,
) => ErrisError | undefined

export interface PrismaAdapterOptions {
  readonly target?: ErrisErrorFactory<string>
  readonly mappings?: Readonly<Record<string, ErrisErrorFactory<string>>>
  readonly mapError?: PrismaErrorMapper
}

export function createPrismaAdapter(
  options: PrismaAdapterOptions,
): ErrisAdapter {
  if (
    options.target === undefined &&
    options.mappings === undefined &&
    options.mapError === undefined
  ) {
    throw new TypeError(
      'Prisma adapter requires at least one of "target", "mappings", or "mapError"',
    )
  }

  const { target, mappings, mapError } = options

  return {
    name: "prisma",
    tryNormalize(value: unknown): ErrisError | undefined {
      if (!isPrismaKnownRequestError(value)) {
        return undefined
      }

      if (mapError !== undefined) {
        const mapped = mapError(value)
        if (mapped !== undefined) {
          return mapped
        }
      }

      if (mappings !== undefined) {
        const mappedFactory = mappings[value.code]
        if (mappedFactory !== undefined) {
          return mappedFactory({ cause: value })
        }
      }

      if (target !== undefined) {
        return target({ cause: value })
      }

      return undefined
    },
  }
}

function isPrismaKnownRequestError(
  value: unknown,
): value is PrismaKnownRequestErrorLike {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as { name?: unknown; code?: unknown }
  return (
    candidate.name === "PrismaClientKnownRequestError" &&
    typeof candidate.code === "string"
  )
}
