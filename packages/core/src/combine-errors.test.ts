import { describe, expect, it } from "vitest"

import { combineErrors } from "./combine-errors.js"
import { defineErrors } from "./define-errors.js"
import { ErrisError } from "./erris-error.js"

describe("combineErrors", () => {
  it("combines catalog factories into one immutable catalog", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
    })
    const AuthErrors = defineErrors("auth", {
      INVALID_TOKEN: {
        message: "Invalid token",
      },
    })

    const AppErrors = combineErrors(UserErrors, AuthErrors)

    expect(Object.getPrototypeOf(AppErrors)).toBeNull()
    expect(Object.isFrozen(AppErrors)).toBe(true)
    expect(Object.keys(AppErrors)).toEqual(["EMAIL_EXISTS", "INVALID_TOKEN"])
    expect(AppErrors.EMAIL_EXISTS()).toBeInstanceOf(ErrisError)
    expect(AppErrors.EMAIL_EXISTS().code).toBe("user.email_exists")
    expect(AppErrors.INVALID_TOKEN().code).toBe("auth.invalid_token")
  })

  it("preserves the original factories", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
    })
    const AuthErrors = defineErrors("auth", {
      INVALID_TOKEN: {
        message: "Invalid token",
      },
    })

    const AppErrors = combineErrors(UserErrors, AuthErrors)

    expect(AppErrors.EMAIL_EXISTS).toBe(UserErrors.EMAIL_EXISTS)
    expect(AppErrors.INVALID_TOKEN).toBe(AuthErrors.INVALID_TOKEN)
  })

  it("rejects duplicate catalog keys", () => {
    const UserErrors = defineErrors("user", {
      NOT_FOUND: {
        message: "User not found",
      },
    })
    const PostErrors = defineErrors("post", {
      NOT_FOUND: {
        message: "Post not found",
      },
    })

    expect(() => combineErrors(UserErrors, PostErrors)).toThrow(
      new TypeError('Duplicate Erris catalog key "NOT_FOUND"'),
    )
  })

  it("rejects duplicate error codes", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
      email_exists: {
        message: "Email already exists lowercase",
      },
    })

    expect(() => combineErrors(UserErrors)).toThrow(
      new TypeError('Duplicate Erris error code "user.email_exists"'),
    )
  })

  it("rejects non-catalog values at runtime", () => {
    const invalidCatalog = {
      BROKEN: () => undefined,
    }

    expect(() => combineErrors(invalidCatalog as never)).toThrow(
      new TypeError('Invalid Erris factory for catalog key "BROKEN"'),
    )
  })
})
