import { defineConfig } from "tsup"

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    outDir: 'dist',
    target: 'es2020',
    bundle: true,
    external: []
});