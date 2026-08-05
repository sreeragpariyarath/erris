import type { ErrisErrorFactory } from "./define-errors.js"
import { ErrisError, isErrisError } from "./erris-error.js"

export interface ErrisAdapter {
  readonly name: string
  tryNormalize(value: unknown): ErrisError | undefined
}

export interface CreateNormalizerOptions {
  readonly fallback: ErrisErrorFactory<string>
  readonly adapters?: readonly ErrisAdapter[]
}

export type ErrisNormalizer = (value: unknown) => ErrisError

export function createNormalizer(
  options: CreateNormalizerOptions,
): ErrisNormalizer {
  const adapters = [...(options.adapters ?? [])]

  return (value: unknown): ErrisError => {
    if (isErrisError(value)) {
      return value
    }

    for (const adapter of adapters) {
      try {
        const normalized = adapter.tryNormalize(value)

        if (isErrisError(normalized)) {
          return normalized
        }
      } catch {
        continue
      }
    }

    return options.fallback({ cause: value })
  }
}
