import { createI18n } from "vue-i18n";
import fr from "./fr.json";
import en from "./en.json";

/**
 * Configuration i18n. Le français est la langue principale et le repli
 * systématique (`fallbackLocale: "fr"`) pour toute chaîne non encore
 * traduite en anglais, conformément au cahier des charges (section 4.4).
 * L'ajout d'une nouvelle langue ne demande que d'importer son fichier de
 * traduction et de l'ajouter à `messages` — aucune refonte de composant.
 */
export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  fallbackLocale: "fr",
  messages: { fr, en },
});
