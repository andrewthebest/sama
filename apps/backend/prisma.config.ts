// Configuration du CLI Prisma (generate/migrate). Depuis Prisma 7, l'URL
// de connexion utilisée par le CLI (pour les migrations) vit ici plutôt
// que dans schema.prisma. Le client applicatif, lui, reçoit sa propre
// connexion via un driver adapter — voir src/prisma/prisma.service.ts.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
