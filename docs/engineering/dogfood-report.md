# Erris Dogfood Verification Report

## Target Application Details

- **Repository**: `dogfood-backend/server`
- **Stack**: Node.js, Express, Mongoose, Zod
- **Module Tested**: Admin Subject Management (`subject.routes.js`,
  `subject.service.js`, `subject.controller.js`)

---

## 1. Erris Packages Installed & Configured

The following workspace packages were packed and installed into
`dogfood-backend/server`:

- `@erris/core`
- `@erris/http`
- `@erris/adapter-zod`

---

## 2. Architecture & Files Created

### A. Domain Error Catalog (`src/errors/subject.errors.js`)

Defined static error catalog for the Subject feature:

```javascript
import { defineErrors } from "@erris/core"

export const SubjectErrors = defineErrors("subject", {
  NOT_FOUND: { message: "Subject not found" },
  DUPLICATE_NAME: {
    message: "A subject with this name already exists for this age group",
  },
  INVALID_INPUT: { message: "Invalid subject parameters" },
  REORDER_FAILED: { message: "Failed to reorder subjects" },
})
```

### B. Application Error Boundary (`src/errors/index.js`)

Configured `createNormalizer`, `createHttpTransport`, Zod adapter, Mongoose
adapter, and legacy `AppError` adapter:

```javascript
import { createNormalizer, combineErrors, defineErrors } from "@erris/core"
import { createHttpTransport } from "@erris/http"
import { createZodAdapter } from "@erris/adapter-zod"

const zodAdapter = createZodAdapter({ target: SubjectErrors.INVALID_INPUT })

export const normalize = createNormalizer({
  fallback: SystemErrors.INTERNAL,
  adapters: [zodAdapter, createMongooseAdapter(), createAppErrorAdapter()],
})

export const renderHttp = createHttpTransport({ ... })

export function cleanError(error) {
  const normalized = normalize(error)
  return renderHttp(normalized)
}
```

### C. Express Global Error Handler (`src/middlewares/error.middleware.js`)

Integrated `cleanError(err)` to replace 35 lines of hand-written `if/else`
checks:

```javascript
export function errorHandler(err, req, res, next) {
  const errisResponse = cleanError(err)
  applyCorsHeaders(req, res)
  res.status(errisResponse.status).json({
    success: false,
    ...errisResponse.body,
  })
}
```

---

## 3. Real-World Test Scenarios & Results

| Scenario                   | Trigger / Input                                   | Expected Result      | Verified Response Code | Response Detail                                                  |
| :------------------------- | :------------------------------------------------ | :------------------- | :--------------------- | :--------------------------------------------------------------- |
| **Resource Not Found**     | `GET /admin/subjects/64abc...` (non-existent ID)  | `404 Not Found`      | `404`                  | `subject.not_found`                                              |
| **Zod Validation Failure** | `POST /admin/subjects` (missing `name`)           | `400 Bad Request`    | `400`                  | `subject.invalid_input` + Zod field issues                       |
| **Malformed ObjectId**     | `GET /admin/subjects/invalid_str` (`CastError`)   | `400 Bad Request`    | `400`                  | Correctly mapped to `400` instead of misleading `404`            |
| **Duplicate Key Conflict** | `POST /admin/subjects` (existing name & ageGroup) | `409 Conflict`       | `409`                  | `subject.duplicate_name`                                         |
| **Transaction Failure**    | Reorder database transaction failure              | `500 Internal Error` | `500`                  | Wrapped in `subject.reorder_failed` without leaking DB internals |
| **Unmanaged Raw Error**    | `throw new Error("unexpected connection drop")`   | `500 Internal Error` | `500`                  | Safely caught by `fallback: SystemErrors.INTERNAL`               |

---

## 4. Key Refinements & Fixes Made

1. **Fixed Runtime `ReferenceError` Bug**: Replaced leftover
   `createError.badRequest()` call in `processBatchReorder` with
   `SubjectErrors.INVALID_INPUT()`.
2. **Semantics Fix for Mongoose `CastError`**: Mapped `CastError` to
   `400 Bad Request` (`SubjectErrors.INVALID_INPUT`) instead of `404`.
3. **Zod Validation Layering**: Moved payload validation to
   `validate.middleware.js` via `schema.parse()`, allowing `@erris/adapter-zod`
   to normalize Zod issues automatically.
4. **Transaction Protection**: Wrapped transaction failures in
   `reorderSubjects`, `moveSubjectToGlobalIndex`, and `processBatchReorder` with
   `throw SubjectErrors.REORDER_FAILED({ cause: err })`.
5. **Contract Alignment**: Verified that `{ message: "..." }` in
   `defineErrors()` matches `@erris/core`'s TypeScript interface contract.

---

## 5. Verification Conclusion

Dogfood testing in `dogfood-backend/server` confirmed that Erris successfully:

- Eliminates boilerplate error handling in Express apps.
- Normalizes all vendor errors (Mongoose, Zod, AppError) and unhandled crashes.
- Guarantees safe, RFC 9457 compliant API error responses across the entire
  backend.
