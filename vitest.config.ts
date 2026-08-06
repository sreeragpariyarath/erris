import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    passWithNoTests: true,
    alias: {
      "@erris/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@erris/http": path.resolve(__dirname, "packages/http/src/index.ts"),
      "@erris/adapter-zod": path.resolve(
        __dirname,
        "packages/adapter-zod/src/index.ts",
      ),
      "@erris/adapter-prisma": path.resolve(
        __dirname,
        "packages/adapter-prisma/src/index.ts",
      ),
    },
  },
})
