# @erris/express

> Express error-handling middleware for
> [Erris](https://github.com/sreeragpariyarath/erris).

[![npm version](https://img.shields.io/npm/v/@erris/express.svg?style=flat-square)](https://www.npmjs.com/package/@erris/express)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

`@erris/express` wires a configured `@erris/core` normalizer and `@erris/http`
transport into a standard Express error-handling middleware. It contains no
domain logic of its own: it catches, normalizes, renders, and sends.

---

## Installation

```bash
# npm
npm install @erris/express @erris/core @erris/http express

# pnpm
pnpm add @erris/express @erris/core @erris/http express

# yarn
yarn add @erris/express @erris/core @erris/http express
```

_Note: `express` is an optional peer dependency (`^4.0.0 || ^5.0.0`)._

---

## Usage

```ts
import express from "express"
import { createErrisExpressMiddleware } from "@erris/express"
import { normalize } from "./errors.js"
import { renderHttp } from "./transport.js"

const app = express()

// ...routes that may throw ErrisError or vendor errors

app.use(
  createErrisExpressMiddleware({
    normalize,
    renderHttp,
  }),
)

app.listen(3000)
```

Any value thrown or passed to `next(error)` inside a route is normalized through
your configured `normalize` function and rendered through your configured
`renderHttp` transport, then sent as the response.

If a response has already started sending headers when the error reaches this
middleware, it delegates to Express's default error handler via `next(error)`
instead of attempting to send a second response.

---

## Full Example

See [`examples/dogfood-backend`](../../examples/dogfood-backend) for a complete
backend example using `@erris/core`, `@erris/http`, and vendor adapters
together.

---

## Features

- 🧩 **Glue Only**: Contains no domain error definitions or vendor mappings —
  those stay in your own `normalize` and `renderHttp` configuration.
- 🛟 **Safe Header Handling**: Delegates to Express's default error handler when
  headers were already sent, instead of throwing.
- ⚡ **Zero Extra Dependencies**: Depends only on `@erris/core` and
  `@erris/http`; `express` stays an optional peer dependency.

---

## License

[MIT](LICENSE) © Sreerag Pariyarath
