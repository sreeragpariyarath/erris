import { defineErrors, type ErrisErrorFactory } from "./index.js"

const UserErrors = defineErrors("user", {
  EMAIL_EXISTS: {
    message: "Email already exists",
  },
  NOT_FOUND: {
    message: "User not found",
  },
})

const emailExists = UserErrors.EMAIL_EXISTS()

const emailExistsCode: "user.email_exists" = emailExists.code
const notFoundCode: "user.not_found" = UserErrors.NOT_FOUND.code

const emailExistsFactory: ErrisErrorFactory<"user.email_exists"> =
  UserErrors.EMAIL_EXISTS

void emailExistsCode
void notFoundCode
void emailExistsFactory

// @ts-expect-error unknown catalog key
type InvalidFactory = (typeof UserErrors)["INVALID"]

// @ts-expect-error factory code is literal and stable
const wrongCode: "user.not_found" = emailExists.code

void wrongCode
