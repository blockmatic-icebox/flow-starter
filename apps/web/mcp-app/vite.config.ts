import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "hunch-explorer.html"),
    },
    target: "es2022",
  },
  plugins: [react(), viteSingleFile()],
  root: path.resolve(import.meta.dirname),
});
