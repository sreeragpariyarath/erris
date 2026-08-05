import { combineErrors, defineErrors, type ErrisErrorFactory } from "./index.js"

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

const emailExistsCode: "user.email_exists" = AppErrors.EMAIL_EXISTS().code
const invalidTokenCode: "auth.invalid_token" = AppErrors.INVALID_TOKEN().code

const emailExistsFactory: ErrisErrorFactory<"user.email_exists"> =
  AppErrors.EMAIL_EXISTS
const invalidTokenFactory: ErrisErrorFactory<"auth.invalid_token"> =
  AppErrors.INVALID_TOKEN

void emailExistsCode
void invalidTokenCode
void emailExistsFactory
void invalidTokenFactory

// @ts-expect-error unknown combined catalog key
type InvalidFactory = (typeof AppErrors)["NOT_FOUND"]

// @ts-expect-error composed factory code is literal and stable
const wrongCode: "auth.invalid_token" = AppErrors.EMAIL_EXISTS().code

void wrongCode
