import { createNormalizer, defineErrors } from "@erris/core"
import { createHttpTransport } from "@erris/http"
import type { NextFunction, Request, Response } from "express"
import { describe, expect, it, vi } from "vitest"
import { createErrisExpressMiddleware } from "./express-middleware.js"

const AppErrors = defineErrors("app", {
  NOT_FOUND: { message: "Not found" },
  INTERNAL: { message: "Internal error" },
})

const normalize = createNormalizer({ fallback: AppErrors.INTERNAL })

const renderHttp = createHttpTransport({
  errors: AppErrors,
  mappings: {
    "app.not_found": { status: 404, title: "Not found" },
    "app.internal": { status: 500, title: "Internal error" },
  },
  fallback: {
    status: 500,
    title: "Internal error",
    code: "app.internal",
  },
})

function createMockResponse() {
  const res = {
    headersSent: false,
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
      return res
    },
    json(body: unknown) {
      res.body = body
      return res
    },
  }

  return res
}

describe("createErrisExpressMiddleware", () => {
  it("renders a known error through the configured transport", () => {
    const middleware = createErrisExpressMiddleware({ normalize, renderHttp })
    const res = createMockResponse()
    const next = vi.fn() as unknown as NextFunction

    middleware(
      AppErrors.NOT_FOUND(),
      {} as Request,
      res as unknown as Response,
      next,
    )

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({ code: "app.not_found", status: 404 })
    expect(next).not.toHaveBeenCalled()
  })

  it("falls back safely for unrecognized thrown values", () => {
    const middleware = createErrisExpressMiddleware({ normalize, renderHttp })
    const res = createMockResponse()
    const next = vi.fn() as unknown as NextFunction

    middleware(
      new Error("boom"),
      {} as Request,
      res as unknown as Response,
      next,
    )

    expect(res.statusCode).toBe(500)
    expect(res.body).toMatchObject({ code: "app.internal" })
  })

  it("applies response headers from the transport mapping", () => {
    const headerRenderHttp = createHttpTransport({
      errors: AppErrors,
      mappings: {
        "app.not_found": {
          status: 404,
          title: "Not found",
          headers: { "x-error-reason": "missing" },
        },
        "app.internal": { status: 500, title: "Internal error" },
      },
      fallback: {
        status: 500,
        title: "Internal error",
        code: "app.internal",
      },
    })
    const middleware = createErrisExpressMiddleware({
      normalize,
      renderHttp: headerRenderHttp,
    })
    const res = createMockResponse()
    const next = vi.fn() as unknown as NextFunction

    middleware(
      AppErrors.NOT_FOUND(),
      {} as Request,
      res as unknown as Response,
      next,
    )

    expect(res.headers["x-error-reason"]).toBe("missing")
  })

  it("delegates to next when headers were already sent", () => {
    const middleware = createErrisExpressMiddleware({ normalize, renderHttp })
    const res = createMockResponse()
    res.headersSent = true
    const next = vi.fn() as unknown as NextFunction
    const error = new Error("boom")

    middleware(error, {} as Request, res as unknown as Response, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.body).toBeUndefined()
  })
})
