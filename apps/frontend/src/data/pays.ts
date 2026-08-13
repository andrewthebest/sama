import { getNames, registerLocale } from "i18n-iso-countries";
// eslint-disable-next-line import/no-unresolved -- fichiers JSON fournis par le paquet
import frLocale from "i18n-iso-countries/langs/fr.json";
// eslint-disable-next-line import/no-unresolved
import enLocale from "i18n-iso-countries/langs/en.json";

registerLocale(frLocale);
registerLocale(enLocale);

export interface OptionPays {
  code: string;
  libelle: string;
}

/**
 * Liste complète des pays du monde (codes ISO-3166-1 alpha-2), avec leur
 * libellé dans la langue demandée. Utilisée pour le sélecteur de pays
 * obligatoire à l'inscription, sur chaque génération de document, et sur
 * chaque ressource soumise (cahier des charges, contrainte transversale).
 *
 * S'appuie sur `i18n-iso-countries` plutôt que sur une liste codée en dur :
 * les noms de pays sont toujours à jour et déjà traduits en français et en
 * anglais, cohérent avec l'architecture i18n de la plateforme (repli
 * systématique vers le français).
 */
export function listePays(locale: "fr" | "en" = "fr"): OptionPays[] {
  const noms = getNames(locale, { select: "official" });
  return Object.entries(noms)
    .map(([code, libelle]) => ({ code, libelle }))
    .sort((a, b) => a.libelle.localeCompare(b.libelle, locale));
}
