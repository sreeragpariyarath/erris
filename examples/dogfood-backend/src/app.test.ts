import { describe, expect, it } from "vitest"
import { handleRequest } from "./app.js"

describe("Dogfood Backend Application", () => {
  it("handles valid user creation (201 Created)", async () => {
    const res = await handleRequest("POST", "/api/users", {
      email: "alice@example.com",
      name: "Alice",
    })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: "usr_123",
      email: "alice@example.com",
      name: "Alice",
    })
  })

  it("normalizes Zod validation errors to 400 Bad Request", async () => {
    const res = await handleRequest("POST", "/api/users", {
      email: "not-an-email",
      name: "A",
    })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      title: "Validation error",
      status: 400,
      detail: "One or more payload parameters failed validation.",
      code: "user.validation_failed",
    })
  })

  it("normalizes Prisma P2002 duplicate errors to 409 Conflict", async () => {
    const res = await handleRequest("POST", "/api/users", {
      email: "existing@example.com",
      name: "Bob",
    })

    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      title: "Email already exists",
      status: 409,
      detail: "A user account with this email address already exists.",
      code: "user.email_exists",
    })
  })

  it("handles domain ErrisError throws (404 Not Found)", async () => {
    const res = await handleRequest("GET", "/api/users/unknown")

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      title: "User not found",
      status: 404,
      detail: "The requested user account was not found.",
      code: "user.user_not_found",
    })
  })

  it("handles domain ErrisError for order total (422 Unprocessable)", async () => {
    const res = await handleRequest("POST", "/api/orders", {
      userId: "usr_123",
      total: -50,
    })

    expect(res.status).toBe(422)
    expect(res.body).toEqual({
      title: "Unprocessable order total",
      status: 422,
      detail: "Order total amount must be a positive integer value.",
      code: "order.invalid_total",
    })
  })

  it("normalizes unexpected raw errors safely to 500 Internal Server Error", async () => {
    const res = await handleRequest("GET", "/api/crash")

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      title: "Internal server error",
      status: 500,
      detail: "An unexpected internal server error occurred.",
      code: "system.internal",
    })
  })
})
