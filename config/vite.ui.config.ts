import { defineConfig, mergeConfig } from "vite";
import react from "@vitejs/plugin-react";
import { base } from "../vite.base.config";

export default mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
    build: {
      emptyOutDir: true,
    },
  }),
);
