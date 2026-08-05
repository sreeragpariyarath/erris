import type { ErrisError, ErrisErrorFactory } from "@erris/core"

export type ErrisHttpTransportPolicy = Readonly<
  Record<string, ErrisErrorFactory<string>>
>

export type ErrisHttpTransportPolicyCode<
  Policy extends ErrisHttpTransportPolicy,
> = ReturnType<Policy[keyof Policy]>["code"]

export interface ErrisHttpMapping {
  readonly status: number
  readonly title: string
  readonly detail?: string
  readonly type?: string
  readonly headers?: Readonly<Record<string, string>>
}

export type ErrisHttpMappings<Code extends string> = Readonly<{
  [KnownCode in Code]: ErrisHttpMapping
}>

export interface ErrisHttpFallback extends ErrisHttpMapping {
  readonly code: string
}

export interface ErrisHttpBody {
  readonly type?: string
  readonly title: string
  readonly status: number
  readonly detail?: string
  readonly code: string
}

export interface ErrisHttpResponse {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body: ErrisHttpBody
}

export interface ErrisHttpTransportOptions<
  Policy extends ErrisHttpTransportPolicy,
> {
  readonly errors: Policy
  readonly mappings: ErrisHttpMappings<ErrisHttpTransportPolicyCode<Policy>>
  readonly fallback: ErrisHttpFallback
}

export type ErrisHttpTransport = (error: ErrisError) => ErrisHttpResponse

export function createHttpTransport<
  const Policy extends ErrisHttpTransportPolicy,
>(options: ErrisHttpTransportOptions<Policy>): ErrisHttpTransport {
  const mappings = options.mappings as Readonly<
    Record<string, ErrisHttpMapping>
  >

  return (error: ErrisError): ErrisHttpResponse => {
    const mapping = mappings[error.code]

    if (mapping === undefined) {
      return render(options.fallback, options.fallback.code)
    }

    return render(mapping, error.code)
  }
}

function render(mapping: ErrisHttpMapping, code: string): ErrisHttpResponse {
  return {
    status: mapping.status,
    headers: {
      ...mapping.headers,
    },
    body: {
      ...(mapping.type === undefined ? {} : { type: mapping.type }),
      title: mapping.title,
      status: mapping.status,
      ...(mapping.detail === undefined ? {} : { detail: mapping.detail }),
      code,
    },
  }
}
