import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "esnext",
  clean: true,
  sourcemap: true,
  dts: true,
  splitting: false,
  minify: false,
  shims: true,
  treeshake: true,
  outDir: "dist",
});
