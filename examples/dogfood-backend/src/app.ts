import type { ErrisHttpResponse } from "@erris/http"
import { z } from "zod"
import { normalize, OrderErrors, UserErrors } from "./errors.js"
import { renderHttp } from "./transport.js"

const createUserSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email(),
  name: z.string().min(2),
})

const createOrderSchema = z.object({
  userId: z.string(),
  total: z.number(),
})

export interface AppResponse {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body: unknown
}

export async function handleRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<AppResponse> {
  await Promise.resolve()

  try {
    if (method === "POST" && path === "/api/users") {
      const payload = createUserSchema.parse(body)

      if (payload.email === "existing@example.com") {
        throw Object.assign(new Error("Unique constraint failed"), {
          name: "PrismaClientKnownRequestError",
          code: "P2002",
          clientVersion: "6.4.1",
          meta: { target: ["email"] },
        })
      }

      return {
        status: 201,
        headers: { "content-type": "application/json" },
        body: { id: "usr_123", email: payload.email, name: payload.name },
      }
    }

    if (method === "GET" && path.startsWith("/api/users/")) {
      const userId = path.replace("/api/users/", "")
      if (userId === "unknown") {
        throw UserErrors.USER_NOT_FOUND()
      }

      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: { id: userId, email: "user@example.com", name: "Jane Doe" },
      }
    }

    if (method === "POST" && path === "/api/orders") {
      const payload = createOrderSchema.parse(body)
      if (payload.total <= 0) {
        throw OrderErrors.INVALID_TOTAL()
      }

      return {
        status: 201,
        headers: { "content-type": "application/json" },
        body: { id: "ord_999", userId: payload.userId, total: payload.total },
      }
    }

    if (method === "GET" && path === "/api/crash") {
      throw new Error("unexpected unhandled database pool timeout")
    }

    throw UserErrors.USER_NOT_FOUND()
  } catch (error: unknown) {
    const normalized = normalize(error)
    const httpResponse: ErrisHttpResponse = renderHttp(normalized)

    return {
      status: httpResponse.status,
      headers: { ...httpResponse.headers, "content-type": "application/json" },
      body: httpResponse.body,
    }
  }
}
