import { describe, expect, it } from "vitest"

import { createNormalizer, type ErrisAdapter } from "./create-normalizer.js"
import { defineErrors } from "./define-errors.js"
import { ErrisError } from "./erris-error.js"

const AppErrors = defineErrors("app", {
  INTERNAL: {
    message: "Internal error",
  },
  LEGACY: {
    message: "Legacy failure",
  },
  VALIDATION: {
    message: "Validation failed",
  },
})

describe("createNormalizer", () => {
  it("passes existing Erris errors through unchanged", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const error = AppErrors.LEGACY()

    expect(normalize(error)).toBe(error)
  })

  it("returns the first successful adapter result", () => {
    const legacyError = AppErrors.LEGACY()
    const validationError = AppErrors.VALIDATION()
    const seen: string[] = []

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [
        {
          name: "first",
          tryNormalize() {
            seen.push("first")
            return undefined
          },
        },
        {
          name: "second",
          tryNormalize() {
            seen.push("second")
            return legacyError
          },
        },
        {
          name: "third",
          tryNormalize() {
            seen.push("third")
            return validationError
          },
        },
      ],
    })

    expect(normalize(new Error("legacy"))).toBe(legacyError)
    expect(seen).toEqual(["first", "second"])
  })

  it("falls back for unmatched values and preserves the original cause", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const thrownValue = { reason: "unknown" }
    const error = normalize(thrownValue)

    expect(error).toBeInstanceOf(ErrisError)
    expect(error.code).toBe("app.internal")
    expect(error.message).toBe("Internal error")
    expect(error.cause).toBe(thrownValue)
  })

  it("accepts primitives, null, and undefined as fallback causes", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })

    expect(normalize("boom").cause).toBe("boom")
    expect(normalize(42).cause).toBe(42)
    expect(normalize(null).cause).toBeNull()
    expect(normalize(undefined).cause).toBeUndefined()
  })

  it("does not throw when an adapter throws", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [
        {
          name: "throwing",
          tryNormalize() {
            throw new Error("adapter failed")
          },
        },
      ],
    })
    const value = new Error("original")

    const error = normalize(value)

    expect(error.code).toBe("app.internal")
    expect(error.cause).toBe(value)
  })

  it("ignores invalid adapter results at runtime", () => {
    const adapter = {
      name: "invalid",
      tryNormalize() {
        return { code: "app.fake" }
      },
    } as unknown as ErrisAdapter

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })
    const value = new Error("original")

    const error = normalize(value)

    expect(error.code).toBe("app.internal")
    expect(error.cause).toBe(value)
  })

  it("does not structurally trust forged Erris-like objects", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const forged = {
      name: "ErrisError",
      code: "app.legacy",
      message: "Legacy failure",
    }

    const error = normalize(forged)

    expect(error).toBeInstanceOf(ErrisError)
    expect(error).not.toBe(forged)
    expect(error.code).toBe("app.internal")
    expect(error.cause).toBe(forged)
  })

  it("does not inspect fallback values with throwing getters", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const thrownValue = Object.defineProperty({}, "message", {
      enumerable: true,
      get() {
        throw new Error("message getter should not run")
      },
    })

    expect(() => normalize(thrownValue)).not.toThrow()
    expect(normalize(thrownValue).cause).toBe(thrownValue)
  })

  it("preserves circular objects as private causes", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const thrownValue: { self?: unknown } = {}
    thrownValue.self = thrownValue

    const error = normalize(thrownValue)

    expect(error.cause).toBe(thrownValue)
    expect(JSON.parse(JSON.stringify(error)) as unknown).toEqual({
      name: "ErrisError",
      code: "app.internal",
    })
  })

  it("survives hostile proxies when no adapter inspects them", () => {
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
    })
    const thrownValue = new Proxy(
      {},
      {
        get() {
          throw new Error("proxy getter should not run")
        },
        ownKeys() {
          throw new Error("proxy keys should not run")
        },
      },
    )

    const error = normalize(thrownValue)

    expect(error.code).toBe("app.internal")
    expect(error.cause).toBe(thrownValue)
  })

  it("continues safely when an adapter trips a hostile proxy", () => {
    const thrownValue = new Proxy(
      {},
      {
        get() {
          throw new Error("proxy getter failed")
        },
      },
    )
    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [
        {
          name: "inspecting",
          tryNormalize(value) {
            Reflect.get(value as object, "message")
            return undefined
          },
        },
      ],
    })

    const error = normalize(thrownValue)

    expect(error.code).toBe("app.internal")
    expect(error.cause).toBe(thrownValue)
  })
})
