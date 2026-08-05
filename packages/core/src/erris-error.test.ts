import { describe, expect, it } from "vitest"

import { ErrisError, isErrisError } from "./erris-error.js"

describe("ErrisError", () => {
  it("behaves like a JavaScript Error", () => {
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
    })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ErrisError)
    expect(error.name).toBe("ErrisError")
    expect(error.message).toBe("Email already exists")
    expect(error.code).toBe("user.email_exists")
    expect(error.stack).toContain("ErrisError: Email already exists")
  })

  it("preserves the cause for internal inspection", () => {
    const cause = new Error("database constraint failed")
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
      cause,
    })

    expect(error.cause).toBe(cause)
  })

  it("keeps cause absent when it is not provided", () => {
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
    })

    expect("cause" in error).toBe(false)
  })

  it("freezes the occurrence identity", () => {
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
    })

    expect(Object.isFrozen(error)).toBe(true)
    expect(() => {
      Object.defineProperty(error, "code", {
        value: "other.code",
      })
    }).toThrow(TypeError)
  })

  it("identifies Erris errors from this package instance", () => {
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
    })

    expect(isErrisError(error)).toBe(true)
    expect(isErrisError(new Error("nope"))).toBe(false)
    expect(isErrisError({ code: "user.email_exists" })).toBe(false)
    expect(isErrisError(null)).toBe(false)
  })

  it("does not enumerate cause or stack by default", () => {
    const error = new ErrisError({
      code: "user.email_exists",
      message: "Email already exists",
      cause: new Error("private"),
    })

    expect(Object.keys(error).sort()).toEqual(["code", "name"])
    expect(JSON.parse(JSON.stringify(error)) as unknown).toEqual({
      name: "ErrisError",
      code: "user.email_exists",
    })
  })
})
