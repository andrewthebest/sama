import { Injectable } from "@nestjs/common";
import { chargerBlocsFixes } from "@sama-emi/config-gabarits";
import { DocumentType, ThematiqueType } from "@sama-emi/contracts";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { ContenuDocument, ContenuParcours, ContenuScenario } from "../documents/composed-content.types";

/** Forme attendue de la sortie de l'outil `rediger_scenario` (voir anthropic-tool-schema.ts). */
interface SortieOutilScenario {
  objectifGeneral: string;
  objectifsSpecifiques: string[];
  publicEtContexte: string;
  profilFormateurTransferabilite: string;
  deroule: ContenuScenario["deroule"];
  fichesActivites: string;
  evaluation: ContenuScenario["evaluation"];
  arbitragesPedagogiques: string;
  materielNecessaire: string;
  variantesEtAdaptations: string;
}

/** Forme attendue de la sortie de l'outil `rediger_parcours`. */
interface SortieOutilParcours {
  objectifsParModule: string;
  publicEtContexte: string;
  profilFormateurTransferabilite: string;
  architectureParcours: ContenuParcours["architectureParcours"];
  derouleParJour: ContenuParcours["derouleParJour"];
  fichesActivitesParModule: string;
  evaluationParcours: ContenuParcours["evaluationParcours"];
  arbitragesPedagogiques: string;
  materielNecessaire: string;
  variantesEtAdaptations: string;
}

/**
 * Fusionne la sortie structurée de Claude avec les blocs fixes du
 * gabarit (jamais générés par l'IA) pour produire le contenu final
 * stocké dans `DocumentVersion.contenu`.
 *
 * Séparer cette étape de l'appel Anthropic garantit que l'encadré
 * « Gestes professionnels du formateur » et les mentions obligatoires
 * proviennent toujours, à l'identique, de
 * `@sama-emi/config-gabarits` — jamais d'une reformulation par le
 * modèle, même accidentelle.
 */
@Injectable()
export class ContentComposerService {
  composerScenario(sortie: SortieOutilScenario, dto: CreateGenerationDto, titre: string): ContenuScenario {
    const blocsFixes = chargerBlocsFixes();
    return {
      gabaritId: "scenario",
      couverture: this.construireCouverture(dto, titre, blocsFixes.mentionThematiquePersonnalisee),
      objectifGeneral: sortie.objectifGeneral,
      objectifsSpecifiques: sortie.objectifsSpecifiques,
      publicEtContexte: sortie.publicEtContexte,
      profilFormateurTransferabilite: sortie.profilFormateurTransferabilite,
      deroule: sortie.deroule,
      fichesActivites: sortie.fichesActivites,
      evaluation: sortie.evaluation,
      arbitragesPedagogiques: sortie.arbitragesPedagogiques,
      materielNecessaire: sortie.materielNecessaire,
      variantesEtAdaptations: sortie.variantesEtAdaptations,
      gestesProfessionnelsFormateur: blocsFixes.gestesProfessionnelsFormateur,
      mentionRessourcesIndicatives: blocsFixes.mentionRessourcesIndicatives,
      mentionMaterielFlexible: blocsFixes.mentionMaterielFlexible,
      mentionIaARelire: blocsFixes.mentionIaARelire,
    };
  }

  composerParcours(sortie: SortieOutilParcours, dto: CreateGenerationDto, titre: string): ContenuParcours {
    const blocsFixes = chargerBlocsFixes();
    return {
      gabaritId: "parcours",
      couverture: this.construireCouverture(dto, titre, blocsFixes.mentionThematiquePersonnalisee),
      objectifsParModule: sortie.objectifsParModule,
      publicEtContexte: sortie.publicEtContexte,
      profilFormateurTransferabilite: sortie.profilFormateurTransferabilite,
      architectureParcours: sortie.architectureParcours,
      derouleParJour: sortie.derouleParJour,
      fichesActivitesParModule: sortie.fichesActivitesParModule,
      evaluationParcours: sortie.evaluationParcours,
      arbitragesPedagogiques: sortie.arbitragesPedagogiques,
      materielNecessaire: sortie.materielNecessaire,
      variantesEtAdaptations: sortie.variantesEtAdaptations,
      gestesProfessionnelsFormateur: blocsFixes.gestesProfessionnelsFormateur,
      mentionRessourcesIndicatives: blocsFixes.mentionRessourcesIndicatives,
      mentionMaterielFlexible: blocsFixes.mentionMaterielFlexible,
      mentionIaARelire: blocsFixes.mentionIaARelire,
    };
  }

  composer(sortieBrute: unknown, dto: CreateGenerationDto, titre: string): ContenuDocument {
    if (dto.type === DocumentType.PARCOURS) {
      return this.composerParcours(sortieBrute as SortieOutilParcours, dto, titre);
    }
    return this.composerScenario(sortieBrute as SortieOutilScenario, dto, titre);
  }

  private construireCouverture(dto: CreateGenerationDto, titre: string, mentionPersonnalisee: string) {
    const citation =
      dto.thematiqueType === ThematiqueType.PERSONNALISEE
        ? mentionPersonnalisee
        : `REFEMI — ${dto.referentielRefemi?.culture} · ${dto.referentielRefemi?.competence} · niveau ${dto.referentielRefemi?.niveau}`;

    return {
      titre,
      citation,
      pays: dto.pays.toUpperCase(),
      public: dto.public,
      duree: dto.type === DocumentType.PARCOURS ? (dto.formatGlobal ?? dto.duree) : dto.duree,
      modalite: dto.modalite,
      profilFormateur: dto.profilFormateur,
      langue: dto.langue,
    };
  }
}
