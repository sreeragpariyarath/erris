import { createNormalizer, defineErrors } from "@erris/core"
import { createPrismaAdapter } from "./prisma-adapter.js"

const AppErrors = defineErrors("app", {
  INTERNAL: { message: "Internal error" },
  DUPLICATE: { message: "Duplicate error" },
})

const adapter = createPrismaAdapter({
  mappings: {
    P2002: AppErrors.DUPLICATE,
  },
  target: AppErrors.INTERNAL,
})

const normalize = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [adapter],
})

const result = normalize(null)
const code: string = result.code

void code
