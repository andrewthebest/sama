import { NiveauRefemi } from "@sama-emi/contracts";

/**
 * Données du sélecteur en cascade REFEMI (Culture → Compétence → Niveau
 * → Thématique). Reflète la structure confirmée par les documents de
 * cadrage (3 domaines, 10 compétences au total : 3 + 2 + 5) mais les
 * intitulés précis de compétences et les thématiques indicatives
 * ci-dessous sont des PLACEHOLDERS — seule « Culture informationnelle /
 * Connaître l'information » provient d'un exemple validé
 * (Scénario_pedagogique_Analyser_Traitement_Information). Le référentiel
 * REFEMI complet n'était pas disponible dans les documents fournis à
 * cette session ; à substituer par le contenu officiel avant mise en
 * production.
 *
 * Le cahier des charges mentionne un composant de sélection en cascade
 * « déjà existant à réutiliser/adapter » : ce fichier fournit une
 * structure de données générique compatible avec un tel composant, à
 * remplacer si l'implémentation existante diffère.
 */

export interface CompetenceRefemi {
  id: string;
  nom: string;
  thematiquesIndicatives: string[];
}

export interface CultureRefemi {
  id: string;
  nom: string;
  competences: CompetenceRefemi[];
}

export const CULTURES_REFEMI: CultureRefemi[] = [
  {
    id: "informationnelle",
    nom: "Culture informationnelle",
    competences: [
      {
        id: "connaitre-information",
        nom: "Connaître l'information",
        thematiquesIndicatives: [
          "Analyser le traitement d'une même information",
          "Distinguer mésinformation, désinformation et malinformation",
        ],
      },
      { id: "evaluer-sources", nom: "Évaluer les sources", thematiquesIndicatives: ["Évaluer la fiabilité d'une source"] },
      {
        id: "diffuser-information",
        nom: "Diffuser l'information de façon responsable",
        thematiquesIndicatives: ["Partager une information vérifiée et sourcée"],
      },
    ],
  },
  {
    id: "mediatique",
    nom: "Culture médiatique",
    competences: [
      {
        id: "comprendre-medias",
        nom: "Comprendre le fonctionnement des médias",
        thematiquesIndicatives: ["Modèles économiques des médias", "Ligne éditoriale"],
      },
      {
        id: "produire-contenu-media",
        nom: "Produire un contenu média",
        thematiquesIndicatives: ["Réaliser une revue de presse", "Produire une capsule d'information"],
      },
    ],
  },
  {
    id: "numerique",
    nom: "Culture numérique",
    competences: [
      { id: "naviguer-web", nom: "Naviguer et rechercher en ligne", thematiquesIndicatives: ["Techniques de recherche avancée"] },
      { id: "identite-numerique", nom: "Gérer son identité numérique", thematiquesIndicatives: ["Traces numériques et vie privée"] },
      {
        id: "reseaux-sociaux",
        nom: "Comprendre les réseaux sociaux et les algorithmes",
        thematiquesIndicatives: ["Bulles de filtre et chambres d'écho"],
      },
      {
        id: "stereotypes-genre",
        nom: "Repérer les stéréotypes en ligne",
        thematiquesIndicatives: ["Stéréotypes de genre dans les publicités et contenus numériques"],
      },
      {
        id: "discours-haine",
        nom: "Prévenir les discours de haine en ligne",
        thematiquesIndicatives: ["Identifier et réagir face aux discours de haine"],
      },
    ],
  },
];

export const NIVEAUX_REFEMI: Array<{ valeur: NiveauRefemi; libelle: string }> = [
  { valeur: NiveauRefemi.ELEMENTAIRE, libelle: "Élémentaire" },
  { valeur: NiveauRefemi.INTERMEDIAIRE, libelle: "Intermédiaire" },
  { valeur: NiveauRefemi.EXPERIMENTE, libelle: "Expérimenté" },
  { valeur: NiveauRefemi.PARCOURS_COMBINE, libelle: "Parcours combiné" },
];
