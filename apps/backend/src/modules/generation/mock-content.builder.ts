import { Injectable } from "@nestjs/common";
import { chargerBlocsFixes, chargerGabaritParcours, chargerGabaritScenario } from "@sama-emi/config-gabarits";
import { DocumentType, ThematiqueType } from "@sama-emi/contracts";
import { CreateGenerationDto } from "./dto/create-generation.dto";

/**
 * Construit un contenu de document *simulé*, structurellement fidèle au
 * gabarit (mêmes sections, mêmes blocs fixes), mais avec des textes
 * d'espace réservé au lieu d'un vrai contenu généré par Claude.
 *
 * Pourquoi ce composant existe dès la Session A : le cahier des charges
 * demande un « mock de réponse pour valider le flux de bout en bout »
 * (endpoints + WebSocket + persistance + aperçu), sans encore appeler
 * l'API Anthropic. Construire ce mock à partir des *mêmes* fichiers de
 * gabarit que ceux qu'utilisera le vrai moteur (Session B) garantit que
 * le frontend d'aperçu est développé contre la structure réelle des
 * documents, pas contre une forme ad hoc qu'il faudrait ensuite migrer.
 */
@Injectable()
export class MockContentBuilder {
  construire(dto: CreateGenerationDto, titre: string): unknown {
    const gabarit = dto.type === DocumentType.PARCOURS ? chargerGabaritParcours() : chargerGabaritScenario();
    const blocsFixes = chargerBlocsFixes();

    const citationCouverture =
      dto.thematiqueType === ThematiqueType.PERSONNALISEE
        ? blocsFixes.mentionThematiquePersonnalisee
        : `REFEMI — ${dto.referentielRefemi?.culture} · ${dto.referentielRefemi?.competence} · niveau ${dto.referentielRefemi?.niveau}`;

    return {
      gabaritId: gabarit.id,
      gabaritVersion: gabarit.version,
      couverture: {
        titre,
        citation: citationCouverture,
        pays: dto.pays,
        public: dto.public,
        duree: dto.type === DocumentType.PARCOURS ? dto.formatGlobal ?? dto.duree : dto.duree,
        modalite: dto.modalite,
        profilFormateur: dto.profilFormateur,
        langue: dto.langue,
      },
      sections: gabarit.sections.map((section) => ({
        numero: section.numero,
        id: section.id,
        titre: section.titre,
        texte: `[Contenu simulé — Session A] Cette section sera rédigée par Claude (tool use) en Session B, en respectant strictement le gabarit « ${gabarit.libelle} ».`,
        tableauMock: section.tableau
          ? [Object.fromEntries(section.tableau.colonnes.map((colonne) => [colonne, "—"]))]
          : undefined,
      })),
      gestesProfessionnelsFormateur: blocsFixes.gestesProfessionnelsFormateur,
      mentionIaARelire: blocsFixes.mentionIaARelire,
    };
  }
}
