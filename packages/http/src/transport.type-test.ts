import { combineErrors, defineErrors } from "@erris/core"

import { createHttpTransport, type ErrisHttpResponse } from "./index.js"

const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "Email already exists",
  },
})

const AppErrors = defineErrors("app", {
  INTERNAL: {
    message: "Internal error",
  },
})

const Errors = combineErrors(UserErrors, AppErrors)

const render = createHttpTransport({
  errors: Errors,
  mappings: {
    "user.email_exists": {
      status: 409,
      title: "Email already exists",
    },
    "app.internal": {
      status: 500,
      title: "Internal server error",
    },
  },
  fallback: {
    status: 500,
    title: "Internal server error",
    code: "internal",
  },
})

const response: ErrisHttpResponse = render(UserErrors.EMAIL_EXISTS())

void response

createHttpTransport({
  errors: Errors,
  // @ts-expect-error all declared codes must be mapped
  mappings: {
    "user.email_exists": {
      status: 409,
      title: "Email already exists",
    },
  },
  fallback: {
    status: 500,
    title: "Internal server error",
    code: "internal",
  },
})

createHttpTransport({
  errors: Errors,
  mappings: {
    "user.email_exists": {
      status: 409,
      title: "Email already exists",
    },
    "app.internal": {
      status: 500,
      title: "Internal server error",
    },
    // @ts-expect-error undeclared codes are rejected
    "user.unknown": {
      status: 400,
      title: "Unknown",
    },
  },
  fallback: {
    status: 500,
    title: "Internal server error",
    code: "internal",
  },
})
