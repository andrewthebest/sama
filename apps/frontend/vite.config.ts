import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // @sama-emi/contracts et @sama-emi/config-gabarits sont des paquets
    // du workspace pnpm (liés par symlink) compilés en CommonJS — Vite
    // ne les pré-bundle pas par défaut (il traite tout ce qui résout à
    // l'intérieur de la racine du monorepo comme du "source", pas comme
    // une dépendance à pré-bundler), donc leur `exports.X = ...` n'est
    // sinon jamais réinterprété en imports ESM nommés. Les inclure ici
    // force le passage par esbuild, qui fait cette conversion.
    include: ["@sama-emi/contracts", "@sama-emi/config-gabarits"],
  },
});
