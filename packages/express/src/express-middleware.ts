import type { ErrisNormalizer } from "@erris/core"
import type { ErrisHttpTransport } from "@erris/http"
import type { ErrorRequestHandler } from "express"

export interface ErrisExpressMiddlewareOptions {
  readonly normalize: ErrisNormalizer
  readonly renderHttp: ErrisHttpTransport
}

export function createErrisExpressMiddleware(
  options: ErrisExpressMiddlewareOptions,
): ErrorRequestHandler {
  const { normalize, renderHttp } = options

  return function errisErrorHandler(error, _req, res, next): void {
    if (res.headersSent) {
      next(error)
      return
    }

    const normalized = normalize(error)
    const response = renderHttp(normalized)

    res.status(response.status)

    for (const [name, value] of Object.entries(response.headers)) {
      res.setHeader(name, value)
    }

    res.json(response.body)
  }
}
