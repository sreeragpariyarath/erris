import type { ErrisAdapter, ErrisError, ErrisErrorFactory } from "@erris/core"
import type { ZodError } from "zod"

export type ZodErrorMapper = (error: ZodError) => ErrisError | undefined

export interface ZodAdapterOptions {
  readonly target?: ErrisErrorFactory<string>
  readonly mapError?: ZodErrorMapper
}

export function createZodAdapter(options: ZodAdapterOptions): ErrisAdapter {
  if (options.target === undefined && options.mapError === undefined) {
    throw new TypeError(
      'Zod adapter requires either a "target" error factory or a "mapError" function',
    )
  }

  const { target, mapError } = options

  return {
    name: "zod",
    tryNormalize(value: unknown): ErrisError | undefined {
      if (!isZodError(value)) {
        return undefined
      }

      if (mapError !== undefined) {
        const mapped = mapError(value)
        if (mapped !== undefined) {
          return mapped
        }
      }

      if (target !== undefined) {
        return target({ cause: value })
      }

      return undefined
    },
  }
}

function isZodError(value: unknown): value is ZodError {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as { name?: unknown; issues?: unknown }
  return candidate.name === "ZodError" && Array.isArray(candidate.issues)
}
