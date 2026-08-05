import { ErrisError } from "./erris-error.js"

export interface ErrisErrorDefinition {
  readonly message: string
}

export interface ErrisErrorFactoryOptions {
  readonly cause?: unknown
}

export interface ErrisErrorFactory<Code extends string> {
  (options?: ErrisErrorFactoryOptions): ErrisError & { readonly code: Code }
  readonly code: Code
  readonly message: string
}

export type ErrisErrorDefinitions = Record<string, ErrisErrorDefinition>

export type ErrisCatalog<
  Namespace extends string,
  Definitions extends ErrisErrorDefinitions,
> = Readonly<{
  [
    Key in keyof Definitions & string
  ]: ErrisErrorFactory<`${Namespace}.${Lowercase<Key>}`>
}>

const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype"])

export function defineErrors<
  const Namespace extends string,
  const Definitions extends ErrisErrorDefinitions,
>(
  namespace: Namespace,
  definitions: Definitions,
): ErrisCatalog<Namespace, Definitions> {
  assertValidIdentifier("namespace", namespace)

  const catalog = Object.create(null) as Record<string, unknown>

  for (const key of Object.keys(definitions)) {
    assertValidIdentifier("definition key", key)

    const definition = definitions[key]

    if (definition === undefined) {
      throw new TypeError(`Missing error definition for "${key}"`)
    }

    const code = `${namespace}.${key.toLowerCase()}`
    const factory = createFactory(code, definition.message)

    Object.defineProperty(catalog, key, {
      value: factory,
      enumerable: true,
      writable: false,
      configurable: false,
    })
  }

  return Object.freeze(catalog) as ErrisCatalog<Namespace, Definitions>
}

function createFactory<Code extends string>(
  code: Code,
  message: string,
): ErrisErrorFactory<Code> {
  const factory = ((options?: ErrisErrorFactoryOptions) =>
    new ErrisError({
      code,
      message,
      ...(options !== undefined && "cause" in options
        ? { cause: options.cause }
        : {}),
    })) as ErrisErrorFactory<Code>

  Object.defineProperties(factory, {
    code: {
      value: code,
      enumerable: true,
      writable: false,
      configurable: false,
    },
    message: {
      value: message,
      enumerable: true,
      writable: false,
      configurable: false,
    },
  })

  return Object.freeze(factory)
}

function assertValidIdentifier(label: string, value: string): void {
  if (value.length === 0) {
    throw new TypeError(`Erris ${label} must not be empty`)
  }

  if (RESERVED_KEYS.has(value)) {
    throw new TypeError(`Erris ${label} "${value}" is reserved`)
  }
}
