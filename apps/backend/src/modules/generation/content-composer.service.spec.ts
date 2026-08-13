import { chargerBlocsFixes } from "@sama-emi/config-gabarits";
import { DocumentType, Modalite, NiveauRefemi, ThematiqueType } from "@sama-emi/contracts";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { ContentComposerService } from "./content-composer.service";

function dtoBase(): CreateGenerationDto {
  const dto = new CreateGenerationDto();
  dto.type = DocumentType.SCENARIO;
  dto.pays = "sn";
  dto.thematiqueType = ThematiqueType.PERSONNALISEE;
  dto.thematiqueLibre = "Test";
  dto.objectifsLibres = "Test";
  dto.public = "Adultes";
  dto.duree = "2h";
  dto.modalite = Modalite.PRESENTIEL;
  dto.profilFormateur = "Formateur test";
  dto.langue = "fr";
  return dto;
}

function sortieScenarioFactice() {
  return {
    objectifGeneral: "Objectif général IA",
    objectifsSpecifiques: ["Objectif 1"],
    publicEtContexte: "Contexte IA",
    profilFormateurTransferabilite: "Profil IA",
    deroule: [],
    fichesActivites: "Fiches IA",
    evaluation: { diagnostique: "d", formative: "f", sommative: "s", aChaud: "a" },
    arbitragesPedagogiques: "Arbitrages IA",
    materielNecessaire: "Matériel IA",
    variantesEtAdaptations: "Variantes IA",
    // Une IA malveillante ou déviante pourrait tenter d'injecter ses
    // propres blocs fixes ; le composer ne doit jamais les lire.
    gestesProfessionnelsFormateur: { titre: "Faux bloc injecté par l'IA", items: [] },
    mentionIaARelire: "Mention falsifiée par l'IA",
  };
}

function sortieParcoursFactice() {
  return {
    objectifsParModule: "Objectifs par module IA",
    publicEtContexte: "Contexte IA",
    profilFormateurTransferabilite: "Profil IA",
    architectureParcours: [],
    derouleParJour: [],
    fichesActivitesParModule: "Fiches IA",
    evaluationParcours: { diagnostiqueJ1: "d", formativeContinue: "f", sommativeFinDeParcours: "s", aChaud: "a", recommandationEvaluationAFroid: "r" },
    arbitragesPedagogiques: "Arbitrages IA",
    materielNecessaire: "Matériel IA",
    variantesEtAdaptations: "Variantes IA",
  };
}

describe("ContentComposerService", () => {
  const service = new ContentComposerService();
  const blocsFixes = chargerBlocsFixes();

  describe("composer — dispatch par type", () => {
    it("route un DocumentType.SCENARIO vers composerScenario", () => {
      const resultat = service.composer(sortieScenarioFactice(), dtoBase(), "Titre");
      expect(resultat.gabaritId).toBe("scenario");
    });

    it("route un DocumentType.PARCOURS vers composerParcours", () => {
      const dto = dtoBase();
      dto.type = DocumentType.PARCOURS;
      const resultat = service.composer(sortieParcoursFactice(), dto, "Titre");
      expect(resultat.gabaritId).toBe("parcours");
    });
  });

  describe("composerScenario — fusion avec les blocs fixes", () => {
    it("ignore tout bloc fixe présent dans la sortie IA et utilise toujours celui de la configuration", () => {
      const resultat = service.composerScenario(sortieScenarioFactice(), dtoBase(), "Titre");

      expect(resultat.gestesProfessionnelsFormateur).toEqual(blocsFixes.gestesProfessionnelsFormateur);
      expect(resultat.gestesProfessionnelsFormateur.titre).not.toBe("Faux bloc injecté par l'IA");
      expect(resultat.mentionIaARelire).toBe(blocsFixes.mentionIaARelire);
      expect(resultat.mentionIaARelire).not.toBe("Mention falsifiée par l'IA");
      expect(resultat.mentionRessourcesIndicatives).toBe(blocsFixes.mentionRessourcesIndicatives);
      expect(resultat.mentionMaterielFlexible).toBe(blocsFixes.mentionMaterielFlexible);
    });

    it("reporte fidèlement le contenu généré par l'IA (hors blocs fixes)", () => {
      const sortie = sortieScenarioFactice();
      const resultat = service.composerScenario(sortie, dtoBase(), "Titre");

      expect(resultat.objectifGeneral).toBe(sortie.objectifGeneral);
      expect(resultat.deroule).toBe(sortie.deroule);
      expect(resultat.evaluation).toEqual(sortie.evaluation);
    });
  });

  describe("construireCouverture (via composerScenario)", () => {
    it("thématique personnalisée : la citation est la mention neutre de la configuration", () => {
      const dto = dtoBase();
      dto.thematiqueType = ThematiqueType.PERSONNALISEE;
      const resultat = service.composerScenario(sortieScenarioFactice(), dto, "Titre");
      expect(resultat.couverture.citation).toBe(blocsFixes.mentionThematiquePersonnalisee);
    });

    it("thématique REFEMI : la citation cite la culture, la compétence et le niveau", () => {
      const dto = dtoBase();
      dto.thematiqueType = ThematiqueType.REFEMI;
      dto.referentielRefemi = { culture: "Culture informationnelle", competence: "Connaître l'information", niveau: NiveauRefemi.INTERMEDIAIRE, thematique: "Test" };
      const resultat = service.composerScenario(sortieScenarioFactice(), dto, "Titre");
      expect(resultat.couverture.citation).toBe("REFEMI — Culture informationnelle · Connaître l'information · niveau INTERMEDIAIRE");
    });

    it("met toujours le pays en majuscules", () => {
      const dto = dtoBase();
      dto.pays = "sn";
      const resultat = service.composerScenario(sortieScenarioFactice(), dto, "Titre");
      expect(resultat.couverture.pays).toBe("SN");
    });

    it("pour un parcours, la durée affichée privilégie formatGlobal sur duree", () => {
      const dto = dtoBase();
      dto.type = DocumentType.PARCOURS;
      dto.duree = "3 jours";
      dto.formatGlobal = "3 jours consécutifs, 6h/jour";
      const resultat = service.composerParcours(sortieParcoursFactice(), dto, "Titre");
      expect(resultat.couverture.duree).toBe("3 jours consécutifs, 6h/jour");
    });

    it("pour un scénario, la durée affichée est toujours dto.duree", () => {
      const dto = dtoBase();
      dto.duree = "2h";
      const resultat = service.composerScenario(sortieScenarioFactice(), dto, "Titre");
      expect(resultat.couverture.duree).toBe("2h");
    });
  });
});
