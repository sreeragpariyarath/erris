import { createNormalizer, defineErrors } from "@erris/core"
import { createHttpTransport } from "@erris/http"
import type { ErrorRequestHandler } from "express"
import { createErrisExpressMiddleware } from "./express-middleware.js"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal error" },
})

const normalize = createNormalizer({ fallback: AppErrors.INTERNAL })

const renderHttp = createHttpTransport({
  errors: AppErrors,
  mappings: {
    "app.internal": { status: 500, title: "Internal error" },
  },
  fallback: {
    status: 500,
    title: "Internal error",
    code: "app.internal",
  },
})

const middleware: ErrorRequestHandler = createErrisExpressMiddleware({
  normalize,
  renderHttp,
})

// @ts-expect-error normalize is required
createErrisExpressMiddleware({ renderHttp })

// @ts-expect-error renderHttp is required
createErrisExpressMiddleware({ normalize })
