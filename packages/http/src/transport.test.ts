import { describe, expect, it } from "vitest"

import { combineErrors, defineErrors, ErrisError } from "@erris/core"

import { createHttpTransport } from "./transport.js"

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

describe("createHttpTransport", () => {
  it("renders mapped Erris errors as safe HTTP responses", () => {
    const render = createHttpTransport({
      errors: Errors,
      mappings: {
        "user.email_exists": {
          status: 409,
          title: "Email already exists",
          detail: "Use a different email address.",
          type: "https://erris.dev/problems/user-email-exists",
          headers: {
            "cache-control": "no-store",
          },
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

    expect(
      render(UserErrors.EMAIL_EXISTS({ cause: new Error("private") })),
    ).toEqual({
      status: 409,
      headers: {
        "cache-control": "no-store",
      },
      body: {
        type: "https://erris.dev/problems/user-email-exists",
        title: "Email already exists",
        status: 409,
        detail: "Use a different email address.",
        code: "user.email_exists",
      },
    })
  })

  it("renders unknown Erris codes through the safe fallback", () => {
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
        detail: "An unexpected error occurred.",
        code: "internal",
      },
    })

    const error = new ErrisError({
      code: "legacy.private_failure",
      message: "database password leaked in message",
      cause: new Error("private cause"),
    })

    expect(render(error)).toEqual({
      status: 500,
      headers: {},
      body: {
        title: "Internal server error",
        status: 500,
        detail: "An unexpected error occurred.",
        code: "internal",
      },
    })
  })

  it("creates fresh response objects instead of exposing the error object", () => {
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
    const error = UserErrors.EMAIL_EXISTS({ cause: new Error("private") })
    const response = render(error)

    expect(response).not.toBe(error)
    expect(response.body).not.toBe(error)
    expect(JSON.stringify(response)).not.toContain("private")
    expect(JSON.stringify(response)).not.toContain("stack")
    expect(JSON.stringify(response)).not.toContain("cause")
  })
})
