import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./locales";
import router from "./router";
import { useAuthStore } from "./stores/auth.store";
import "./styles/main.css";

/**
 * Point d'entrée du frontend.
 *
 * En mode démonstration (`VITE_USE_MOCKS=true`), le service worker MSW
 * est démarré avant le montage de l'application, afin qu'aucune requête
 * ne parte vers un backend inexistant pendant l'initialisation des
 * stores. Le reste du bootstrap est strictement identique entre les
 * deux modes.
 */
async function demarrer(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    const { demarrerMocks } = await import("./mocks/browser");
    await demarrerMocks();
  }

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(i18n);

  useAuthStore().chargerDepuisStockage();

  app.mount("#app");
}

void demarrer();
