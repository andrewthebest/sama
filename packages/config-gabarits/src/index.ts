export * from "./types";
// Le chargeur fs (`loader.ts`) utilise `__dirname` et lit les gabarits
// depuis le disque : il ne fonctionne qu'en environnement Node.js
// (backend). Il est réexporté ici par simplicité (paquet non publié,
// consommé uniquement par le backend en Session A) — si un jour le
// frontend importe ce paquet, séparer les deux points d'entrée
// (ex. `@sama-emi/config-gabarits/types` vs `/loader`) pour éviter
// qu'un bundler navigateur n'embarque `loader.ts`.
export * from "./loader";
