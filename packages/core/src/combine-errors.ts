import type { ErrisCatalog, ErrisErrorFactory } from "./define-errors.js"

export type AnyErrisCatalog = ErrisCatalog<string, Record<string, never>>

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never

export type CombinedErrisCatalog<Catalogs extends readonly AnyErrisCatalog[]> =
  Readonly<UnionToIntersection<Catalogs[number]>>

export function combineErrors<
  const Catalogs extends readonly AnyErrisCatalog[],
>(...catalogs: Catalogs): CombinedErrisCatalog<Catalogs> {
  const combined = Object.create(null) as Record<string, unknown>
  const seenCodes = new Set<string>()

  for (const catalog of catalogs) {
    for (const key of Object.keys(catalog)) {
      if (Object.hasOwn(combined, key)) {
        throw new TypeError(`Duplicate Erris catalog key "${key}"`)
      }

      const factory = catalog[key]

      if (!isErrisFactory(factory)) {
        throw new TypeError(`Invalid Erris factory for catalog key "${key}"`)
      }

      if (seenCodes.has(factory.code)) {
        throw new TypeError(`Duplicate Erris error code "${factory.code}"`)
      }

      seenCodes.add(factory.code)

      Object.defineProperty(combined, key, {
        value: factory,
        enumerable: true,
        writable: false,
        configurable: false,
      })
    }
  }

  return Object.freeze(combined) as CombinedErrisCatalog<Catalogs>
}

function isErrisFactory(value: unknown): value is ErrisErrorFactory<string> {
  return (
    typeof value === "function" &&
    Object.hasOwn(value, "code") &&
    typeof (value as { readonly code?: unknown }).code === "string"
  )
}
