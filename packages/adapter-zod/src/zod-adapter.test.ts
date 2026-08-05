import { createNormalizer, defineErrors, isErrisError } from "@erris/core"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { createZodAdapter, type ZodAdapterOptions } from "./zod-adapter.js"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal error" },
  VALIDATION_FAILED: { message: "Validation failed" },
  CUSTOM_VALIDATION: { message: "Custom validation error" },
})

describe("createZodAdapter", () => {
  it("throws TypeError if neither target nor mapError is provided", () => {
    const invalidOptions: ZodAdapterOptions = {}
    expect(() => createZodAdapter(invalidOptions)).toThrow(
      'Zod adapter requires either a "target" error factory or a "mapError" function',
    )
  })

  it("normalizes a ZodError to the target factory with cause attached", () => {
    const adapter = createZodAdapter({
      target: AppErrors.VALIDATION_FAILED,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    let zodError: unknown
    try {
      z.string().parse(123)
    } catch (err) {
      zodError = err
    }

    const normalized = normalize(zodError)

    expect(isErrisError(normalized)).toBe(true)
    expect(normalized.code).toBe("app.validation_failed")
    expect(normalized.cause).toBe(zodError)
  })

  it("supports custom mapError logic", () => {
    const adapter = createZodAdapter({
      mapError(err) {
        if (err.issues.some((issue) => issue.path.includes("custom"))) {
          return AppErrors.CUSTOM_VALIDATION({ cause: err })
        }
        return undefined
      },
      target: AppErrors.VALIDATION_FAILED,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const schema = z.object({
      custom: z.string(),
      other: z.number(),
    })

    let customError: unknown
    try {
      schema.parse({ custom: 123, other: 456 })
    } catch (err) {
      customError = err
    }

    const normalizedCustom = normalize(customError)
    expect(normalizedCustom.code).toBe("app.custom_validation")

    let otherError: unknown
    try {
      z.string().parse(999)
    } catch (err) {
      otherError = err
    }

    const normalizedOther = normalize(otherError)
    expect(normalizedOther.code).toBe("app.validation_failed")
  })

  it("ignores non-Zod errors", () => {
    const adapter = createZodAdapter({
      target: AppErrors.VALIDATION_FAILED,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const standardError = new Error("ordinary failure")
    const normalized = normalize(standardError)

    expect(normalized.code).toBe("app.internal")
    expect(normalized.cause).toBe(standardError)
  })

  it("handles cross-realm Zod error objects safely", () => {
    const adapter = createZodAdapter({
      target: AppErrors.VALIDATION_FAILED,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const fakeCrossRealmZodError = {
      name: "ZodError",
      issues: [{ message: "Expected string, received number", path: [] }],
    }

    const normalized = normalize(fakeCrossRealmZodError)
    expect(normalized.code).toBe("app.validation_failed")
    expect(normalized.cause).toBe(fakeCrossRealmZodError)
  })
})
