import { createPrismaAdapter } from "@erris/adapter-prisma"
import { createZodAdapter } from "@erris/adapter-zod"
import {
  combineErrors,
  createNormalizer,
  defineErrors,
  type ErrisNormalizer,
} from "@erris/core"

export const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "A user with this email address already exists",
  },
  USER_NOT_FOUND: {
    message: "Requested user account was not found",
  },
  VALIDATION_FAILED: {
    message: "User input parameters failed validation checks",
  },
})

export const OrderErrors = defineErrors("order", {
  INVALID_TOTAL: {
    message: "Order total amount must be a positive integer",
  },
  ORDER_NOT_FOUND: {
    message: "Order with specified identifier was not found",
  },
})

export const SystemErrors = defineErrors("system", {
  INTERNAL: {
    message: "An unexpected internal server error occurred",
  },
})

export const Errors = combineErrors(UserErrors, OrderErrors, SystemErrors)

const zodAdapter = createZodAdapter({
  target: UserErrors.VALIDATION_FAILED,
})

const prismaAdapter = createPrismaAdapter({
  mappings: {
    P2002: UserErrors.EMAIL_EXISTS,
    P2025: UserErrors.USER_NOT_FOUND,
  },
  target: SystemErrors.INTERNAL,
})

export const normalize: ErrisNormalizer = createNormalizer({
  fallback: SystemErrors.INTERNAL,
  adapters: [zodAdapter, prismaAdapter],
})
