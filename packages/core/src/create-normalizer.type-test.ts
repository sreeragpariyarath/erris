import {
  createNormalizer,
  defineErrors,
  type ErrisAdapter,
  type ErrisNormalizer,
} from "./index.js"

const AppErrors = defineErrors("app", {
  INTERNAL: {
    message: "Internal error",
  },
  LEGACY: {
    message: "Legacy failure",
  },
})

const adapter: ErrisAdapter = {
  name: "legacy",
  tryNormalize(value: unknown) {
    if (value instanceof Error && value.message === "legacy") {
      return AppErrors.LEGACY({ cause: value })
    }

    return undefined
  },
}

const normalize: ErrisNormalizer = createNormalizer({
  fallback: AppErrors.INTERNAL,
  adapters: [adapter],
})

const error = normalize("boom")
const code: string = error.code

void code

// @ts-expect-error fallback must be an Erris factory
createNormalizer({ fallback: new Error("nope") })

// @ts-expect-error adapters must expose tryNormalize
createNormalizer({ fallback: AppErrors.INTERNAL, adapters: [{ name: "bad" }] })
