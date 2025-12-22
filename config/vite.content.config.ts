import { defineConfig, mergeConfig } from "vite";
import { resolve } from "path";
import { base } from "../vite.base.config";

export default mergeConfig(
  base,
  defineConfig({
    build: {
      rollupOptions: {
        input: {
          contentScript: resolve(process.cwd(), "src/scripts/content/contentScript.ts"),
        },
        output: {
          format: "iife",
          entryFileNames: "contentScript.js",
        },
      },
    },
  }),
);
