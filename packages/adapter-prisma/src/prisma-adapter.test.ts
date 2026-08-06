import { createNormalizer, defineErrors, isErrisError } from "@erris/core"
import { describe, expect, it } from "vitest"
import {
  createPrismaAdapter,
  type PrismaAdapterOptions,
} from "./prisma-adapter.js"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal error" },
  DUPLICATE_ENTRY: { message: "Duplicate entry" },
  RECORD_NOT_FOUND: { message: "Record not found" },
  CUSTOM_PRISMA: { message: "Custom Prisma error" },
})

describe("createPrismaAdapter", () => {
  it("throws TypeError if target, mappings, and mapError are all omitted", () => {
    const invalidOptions: PrismaAdapterOptions = {}
    expect(() => createPrismaAdapter(invalidOptions)).toThrow(
      'Prisma adapter requires at least one of "target", "mappings", or "mapError"',
    )
  })

  it("maps Prisma error codes to target factories via mappings dictionary", () => {
    const adapter = createPrismaAdapter({
      mappings: {
        P2002: AppErrors.DUPLICATE_ENTRY,
        P2025: AppErrors.RECORD_NOT_FOUND,
      },
      target: AppErrors.INTERNAL,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const p2002Error = {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      clientVersion: "6.4.1",
      meta: { target: ["email"] },
    }

    const normalizedP2002 = normalize(p2002Error)
    expect(isErrisError(normalizedP2002)).toBe(true)
    expect(normalizedP2002.code).toBe("app.duplicate_entry")
    expect(normalizedP2002.cause).toBe(p2002Error)

    const p2025Error = {
      name: "PrismaClientKnownRequestError",
      code: "P2025",
      clientVersion: "6.4.1",
    }

    const normalizedP2025 = normalize(p2025Error)
    expect(normalizedP2025.code).toBe("app.record_not_found")
  })

  it("falls back to default target for unmapped Prisma error codes", () => {
    const adapter = createPrismaAdapter({
      mappings: {
        P2002: AppErrors.DUPLICATE_ENTRY,
      },
      target: AppErrors.INTERNAL,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const unmappedPrismaError = {
      name: "PrismaClientKnownRequestError",
      code: "P2003",
      clientVersion: "6.4.1",
    }

    const normalized = normalize(unmappedPrismaError)
    expect(normalized.code).toBe("app.internal")
    expect(normalized.cause).toBe(unmappedPrismaError)
  })

  it("supports custom mapError logic overriding mappings", () => {
    const adapter = createPrismaAdapter({
      mapError(err) {
        if (err.code === "P2002" && err.meta?.target === "custom_field") {
          return AppErrors.CUSTOM_PRISMA({ cause: err })
        }
        return undefined
      },
      mappings: {
        P2002: AppErrors.DUPLICATE_ENTRY,
      },
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const customPrismaError = {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      clientVersion: "6.4.1",
      meta: { target: "custom_field" },
    }

    const normalizedCustom = normalize(customPrismaError)
    expect(normalizedCustom.code).toBe("app.custom_prisma")

    const standardP2002 = {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      clientVersion: "6.4.1",
      meta: { target: "other_field" },
    }

    const normalizedStandard = normalize(standardP2002)
    expect(normalizedStandard.code).toBe("app.duplicate_entry")
  })

  it("ignores non-Prisma errors", () => {
    const adapter = createPrismaAdapter({
      target: AppErrors.INTERNAL,
    })

    const normalize = createNormalizer({
      fallback: AppErrors.INTERNAL,
      adapters: [adapter],
    })

    const standardError = new Error("ordinary database connection failed")
    const normalized = normalize(standardError)

    expect(normalized.code).toBe("app.internal")
    expect(normalized.cause).toBe(standardError)
  })
})
