import { createHttpTransport, type ErrisHttpTransport } from "@erris/http"
import { Errors } from "./errors.js"

export const renderHttp: ErrisHttpTransport = createHttpTransport({
  errors: Errors,
  mappings: {
    "user.email_exists": {
      status: 409,
      title: "Email already exists",
      detail: "A user account with this email address already exists.",
    },
    "user.user_not_found": {
      status: 404,
      title: "User not found",
      detail: "The requested user account was not found.",
    },
    "user.validation_failed": {
      status: 400,
      title: "Validation error",
      detail: "One or more payload parameters failed validation.",
    },
    "order.invalid_total": {
      status: 422,
      title: "Unprocessable order total",
      detail: "Order total amount must be a positive integer value.",
    },
    "order.order_not_found": {
      status: 404,
      title: "Order not found",
      detail: "The requested order identifier was not found.",
    },
    "system.internal": {
      status: 500,
      title: "Internal server error",
      detail: "An unexpected internal server error occurred.",
    },
  },
  fallback: {
    status: 500,
    title: "Internal server error",
    detail: "An unexpected error occurred on the server.",
    code: "system.internal",
  },
})
