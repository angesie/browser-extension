import { defineConfig, mergeConfig } from "vite";
import { resolve } from "path";
import { base } from "../vite.base.config";

export default mergeConfig(
  base,
  defineConfig({
    build: {
      rollupOptions: {
        input: {
          pageScript: resolve(process.cwd(), "src/scripts/page/pageScript.ts"),
        },
        output: {
          format: "iife",
          entryFileNames: "pageScript.js",
        },
      },
    },
  }),
);
