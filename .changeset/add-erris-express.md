---
"@erris/express": minor
---

Add `@erris/express`, an Express error-handling middleware that wires a
configured `@erris/core` normalizer and `@erris/http` transport into a standard
`(error, req, res, next)` Express error handler. Contains no domain logic of its
own — it catches, normalizes, renders, and sends.
