import { describe, expect, it } from "vitest"

import { defineErrors } from "./define-errors.js"
import { ErrisError } from "./erris-error.js"

describe("defineErrors", () => {
  it("creates typed factories for namespaced error identities", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
      NOT_FOUND: {
        message: "User not found",
      },
    })

    const error = UserErrors.EMAIL_EXISTS()

    expect(error).toBeInstanceOf(ErrisError)
    expect(error.code).toBe("user.email_exists")
    expect(error.message).toBe("Email already exists")
    expect(UserErrors.EMAIL_EXISTS.code).toBe("user.email_exists")
    expect(UserErrors.NOT_FOUND.code).toBe("user.not_found")
  })

  it("preserves causes through factories", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
    })

    const cause = new Error("database constraint failed")
    const error = UserErrors.EMAIL_EXISTS({ cause })

    expect(error.cause).toBe(cause)
  })

  it("freezes catalogs and factories", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
    })

    expect(Object.isFrozen(UserErrors)).toBe(true)
    expect(Object.isFrozen(UserErrors.EMAIL_EXISTS)).toBe(true)
    expect(() => {
      Object.defineProperty(UserErrors, "OTHER", {
        value: () => undefined,
      })
    }).toThrow(TypeError)
    expect(() => {
      Object.defineProperty(UserErrors.EMAIL_EXISTS, "code", {
        value: "other.code",
      })
    }).toThrow(TypeError)
  })

  it("uses own properties without a prototype", () => {
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
    })

    expect(Object.getPrototypeOf(UserErrors)).toBeNull()
    expect(Object.keys(UserErrors)).toEqual(["EMAIL_EXISTS"])
  })

  it("ignores inherited definition properties", () => {
    const definitions = Object.create({
      INHERITED: {
        message: "Inherited",
      },
    }) as {
      EMAIL_EXISTS: {
        message: string
      }
      INHERITED?: {
        message: string
      }
    }

    definitions.EMAIL_EXISTS = {
      message: "Email already exists",
    }

    const UserErrors = defineErrors("user", definitions)

    expect(Object.keys(UserErrors)).toEqual(["EMAIL_EXISTS"])
    expect("INHERITED" in UserErrors).toBe(false)
  })

  it("does not invoke arbitrary getters beyond declared message access", () => {
    const definition = {
      message: "Email already exists",
      get detail() {
        throw new Error("detail getter should not run")
      },
    }

    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: definition,
    })

    expect(UserErrors.EMAIL_EXISTS().message).toBe("Email already exists")
  })

  it("rejects throwing message getters without continuing partially", () => {
    const definitions = {
      EMAIL_EXISTS: {
        get message() {
          throw new Error("message getter failed")
        },
      },
    } as unknown as {
      EMAIL_EXISTS: {
        message: string
      }
    }

    expect(() => defineErrors("user", definitions)).toThrow(
      new Error("message getter failed"),
    )
  })

  it("rejects empty namespaces and keys", () => {
    expect(() =>
      defineErrors("", {
        EMAIL_EXISTS: {
          message: "Email already exists",
        },
      }),
    ).toThrow(TypeError)

    expect(() =>
      defineErrors("user", {
        "": {
          message: "Invalid",
        },
      }),
    ).toThrow(TypeError)
  })

  it("rejects prototype-polluting keys", () => {
    expect(() =>
      defineErrors("user", {
        ["__proto__"]: {
          message: "Invalid",
        },
      }),
    ).toThrow(TypeError)

    expect(() =>
      defineErrors("user", {
        constructor: {
          message: "Invalid",
        },
      }),
    ).toThrow(TypeError)

    expect(() =>
      defineErrors("user", {
        prototype: {
          message: "Invalid",
        },
      }),
    ).toThrow(TypeError)
  })

  it("ignores symbol definition keys", () => {
    const symbolKey = Symbol("symbolic")
    const UserErrors = defineErrors("user", {
      EMAIL_EXISTS: {
        message: "Email already exists",
      },
      [symbolKey]: {
        message: "Symbolic",
      },
    })

    expect(Object.keys(UserErrors)).toEqual(["EMAIL_EXISTS"])
    expect(Object.getOwnPropertySymbols(UserErrors)).toEqual([])
  })
})
