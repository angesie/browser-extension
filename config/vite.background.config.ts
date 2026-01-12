import { defineConfig, mergeConfig } from "vite";
import { resolve } from "path";
import { base } from "../vite.base.config";

export default mergeConfig(
  base,
  defineConfig({
    build: {
      rollupOptions: {
        input: {
          serviceWorker: resolve(
            process.cwd(),
            "src/scripts/background/serviceWorker.ts",
          ),
        },
        output: {
          format: "es",
          entryFileNames: "serviceWorker.js",
        },
      },
    },
  }),
);
