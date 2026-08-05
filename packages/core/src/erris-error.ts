export interface ErrisErrorOptions {
  readonly code: string
  readonly message: string
  readonly cause?: unknown
}

export class ErrisError extends Error {
  readonly code!: string

  constructor(options: ErrisErrorOptions) {
    const hasCause = "cause" in options

    super(options.message, hasCause ? { cause: options.cause } : undefined)

    this.name = "ErrisError"

    Object.defineProperty(this, "code", {
      value: options.code,
      enumerable: true,
      writable: false,
      configurable: false,
    })

    Object.freeze(this)
  }
}

export function isErrisError(value: unknown): value is ErrisError {
  return value instanceof ErrisError
}
