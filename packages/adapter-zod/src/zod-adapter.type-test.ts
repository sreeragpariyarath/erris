import { createNormalizer, defineErrors } from "@erris/core"
import { createZodAdapter } from "./zod-adapter.js"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal error" },
  VALIDATION_FAILED: { message: "Validation error" },
})

const adapter = createZodAdapter({
  target: AppErrors.VALIDATION_FAILED,
})

const normalize = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [adapter],
})

const result = normalize(null)
const code: string = result.code

void code
