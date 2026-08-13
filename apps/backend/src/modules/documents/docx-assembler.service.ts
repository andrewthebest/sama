import { Injectable } from "@nestjs/common";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { ContenuDocument, LigneDeroule } from "./composed-content.types";

const COULEUR_MARQUE = "0E7C7B";
const COULEUR_MARQUE_CLAIRE = "E4F0EE";

/**
 * Assemble un fichier `.docx` réel à partir du contenu composé
 * (`ContenuDocument`) — jamais depuis la sortie brute de l'IA.
 *
 * Respecte scrupuleusement le gabarit validé (cahier des charges,
 * section 6) : les objectifs SMART sont rendus sans étiquette Bloom,
 * chaque tableau de déroulé porte la colonne « Mode d'apprentissage »,
 * et l'encadré « Gestes professionnels du formateur » — déjà injecté
 * tel quel par `ContentComposerService` — est rendu identique quel que
 * soit le document.
 */
@Injectable()
export class DocxAssemblerService {
  async assembler(contenu: ContenuDocument): Promise<Buffer> {
    const enfants: Array<Paragraph | Table> = [
      ...this.construireCouverture(contenu),
      ...(contenu.gabaritId === "parcours" ? this.construireCorpsParcours(contenu) : this.construireCorpsScenario(contenu)),
      ...this.construireSectionsCommunes(contenu),
      this.paragraphe(contenu.mentionIaARelire, { italique: true, taille: 18, couleur: "666666" }),
    ];

    const document = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
      },
      sections: [{ children: enfants }],
    });

    return Packer.toBuffer(document);
  }

  // ---------------------------------------------------------------------
  // Couverture
  // ---------------------------------------------------------------------

  private construireCouverture(contenu: ContenuDocument): Paragraph[] {
    const { couverture } = contenu;
    return [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: couverture.titre, color: COULEUR_MARQUE, bold: true })],
      }),
      this.paragraphe(couverture.citation, { italique: true }),
      this.paragraphe(
        `Pays : ${couverture.pays}  ·  Public : ${couverture.public}  ·  Durée : ${couverture.duree}  ·  Modalité : ${couverture.modalite}`,
      ),
      this.paragraphe(`Profil du formateur : ${couverture.profilFormateur}  ·  Langue : ${couverture.langue}`, {
        espaceApres: 300,
      }),
    ];
  }

  // ---------------------------------------------------------------------
  // Corps — scénario (gabarit 9 sections)
  // ---------------------------------------------------------------------

  private construireCorpsScenario(contenu: Extract<ContenuDocument, { gabaritId: "scenario" }>): Array<Paragraph | Table> {
    return [
      this.titreSection(1, "Objectifs pédagogiques"),
      this.paragraphe(contenu.objectifGeneral, { gras: true }),
      ...contenu.objectifsSpecifiques.map((os) => this.puce(os)),

      this.titreSection(2, "Public et contexte"),
      this.paragraphe(contenu.publicEtContexte),

      this.titreSection(3, "Profil et compétences de transférabilité du formateur"),
      this.paragraphe(contenu.profilFormateurTransferabilite),
      ...this.construireGestesProfessionnels(contenu),

      this.titreSection(4, "Déroulé détaillé de la séance"),
      this.construireTableauDeroule(contenu.deroule),

      this.titreSection(5, "Fiches détaillées des activités"),
      this.paragraphe(contenu.fichesActivites),
      this.paragraphe(contenu.mentionRessourcesIndicatives, { italique: true, taille: 18 }),

      this.titreSection(6, "Évaluation"),
      this.sousTitre("Diagnostique"),
      this.paragraphe(contenu.evaluation.diagnostique),
      this.sousTitre("Formative"),
      this.paragraphe(contenu.evaluation.formative),
      this.sousTitre("Sommative"),
      this.paragraphe(contenu.evaluation.sommative),
      this.sousTitre("À chaud"),
      this.paragraphe(contenu.evaluation.aChaud),

      this.titreSection(7, "Arbitrages pédagogiques"),
      this.paragraphe(contenu.arbitragesPedagogiques),

      this.titreSection(8, "Matériel nécessaire"),
      this.paragraphe(contenu.materielNecessaire),
      this.paragraphe(contenu.mentionMaterielFlexible, { italique: true, taille: 18 }),

      this.titreSection(9, "Variantes et adaptations"),
      this.paragraphe(contenu.variantesEtAdaptations),
    ];
  }

  // ---------------------------------------------------------------------
  // Corps — parcours (architecture multi-modules)
  // ---------------------------------------------------------------------

  private construireCorpsParcours(contenu: Extract<ContenuDocument, { gabaritId: "parcours" }>): Array<Paragraph | Table> {
    const derouleParJour = contenu.derouleParJour.flatMap((jour) => [
      this.sousTitre(`Jour ${jour.jour}`),
      this.construireTableauDeroule(jour.tableau),
    ]);

    return [
      this.titreSection(1, "Objectifs pédagogiques du parcours"),
      this.paragraphe(contenu.objectifsParModule),

      this.titreSection(2, "Public et contexte"),
      this.paragraphe(contenu.publicEtContexte),

      this.titreSection(3, "Profil et compétences de transférabilité du formateur"),
      this.paragraphe(contenu.profilFormateurTransferabilite),
      ...this.construireGestesProfessionnels(contenu),

      this.titreSection(4, "Architecture du parcours"),
      this.construireTableauArchitecture(contenu.architectureParcours),

      this.titreSection(5, "Déroulé détaillé par journée"),
      ...derouleParJour,

      this.titreSection(6, "Fiches détaillées des activités par module"),
      this.paragraphe(contenu.fichesActivitesParModule),
      this.paragraphe(contenu.mentionRessourcesIndicatives, { italique: true, taille: 18 }),

      this.titreSection(7, "Évaluation du parcours"),
      this.sousTitre("Diagnostique (jour 1)"),
      this.paragraphe(contenu.evaluationParcours.diagnostiqueJ1),
      this.sousTitre("Formative continue"),
      this.paragraphe(contenu.evaluationParcours.formativeContinue),
      this.sousTitre("Sommative (fin de parcours)"),
      this.paragraphe(contenu.evaluationParcours.sommativeFinDeParcours),
      this.sousTitre("À chaud"),
      this.paragraphe(contenu.evaluationParcours.aChaud),
      this.sousTitre("Recommandation d'évaluation à froid"),
      this.paragraphe(contenu.evaluationParcours.recommandationEvaluationAFroid),

      this.titreSection(8, "Arbitrages pédagogiques"),
      this.paragraphe(contenu.arbitragesPedagogiques),

      this.titreSection(9, "Matériel nécessaire"),
      this.paragraphe(contenu.materielNecessaire),
      this.paragraphe(contenu.mentionMaterielFlexible, { italique: true, taille: 18 }),

      this.titreSection(10, "Variantes et adaptations"),
      this.paragraphe(contenu.variantesEtAdaptations),
    ];
  }

  private construireSectionsCommunes(_contenu: ContenuDocument): Paragraph[] {
    return [];
  }

  // ---------------------------------------------------------------------
  // Bloc fixe — Gestes professionnels du formateur (jamais généré par l'IA)
  // ---------------------------------------------------------------------

  private construireGestesProfessionnels(contenu: ContenuDocument): Paragraph[] {
    const bloc = contenu.gestesProfessionnelsFormateur;
    return [
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: COULEUR_MARQUE_CLAIRE, fill: COULEUR_MARQUE_CLAIRE },
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: bloc.titre, bold: true, color: "0A5B5A" })],
      }),
      ...bloc.items.flatMap((item) => [
        this.paragraphe(item.libelle, { gras: true, taille: 20, espaceApres: 20 }),
        this.paragraphe(item.texte, { taille: 20, espaceApres: 150 }),
      ]),
    ];
  }

  // ---------------------------------------------------------------------
  // Tableaux
  // ---------------------------------------------------------------------

  private construireTableauDeroule(lignes: LigneDeroule[]): Table {
    const entetes = ["Horaire", "Étape", "Contenu et objectif", "Mode d'apprentissage", "Modalité", "Matériel"];
    return this.tableau(entetes, lignes.map((l) => [l.horaire, l.etape, l.contenuEtObjectif, l.modeApprentissage, l.modalite, l.materiel]));
  }

  private construireTableauArchitecture(
    lignes: Array<{ module: string; domaineCompetenceRefemi: string; niveau: string; duree: string; jour: string }>,
  ): Table {
    const entetes = ["Module", "Domaine / compétence REFEMI", "Niveau", "Durée", "Jour"];
    return this.tableau(entetes, lignes.map((l) => [l.module, l.domaineCompetenceRefemi, l.niveau, l.duree, l.jour]));
  }

  private tableau(entetes: string[], lignes: string[][]): Table {
    const ligneEntete = new TableRow({
      tableHeader: true,
      children: entetes.map(
        (texte) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: COULEUR_MARQUE, fill: COULEUR_MARQUE },
            children: [new Paragraph({ children: [new TextRun({ text: texte, bold: true, color: "FFFFFF", size: 18 })] })],
          }),
      ),
    });

    const lignesCorps = lignes.map(
      (ligne) =>
        new TableRow({
          children: ligne.map(
            (valeur) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: valeur, size: 18 })] })] }),
          ),
        }),
    );

    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [ligneEntete, ...lignesCorps] });
  }

  // ---------------------------------------------------------------------
  // Helpers de mise en forme
  // ---------------------------------------------------------------------

  private titreSection(numero: number, texte: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [new TextRun({ text: `${numero}. ${texte}`, color: COULEUR_MARQUE, bold: true })],
    });
  }

  private sousTitre(texte: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: texte, bold: true })],
    });
  }

  private puce(texte: string): Paragraph {
    return new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: texte })] });
  }

  private paragraphe(
    texte: string,
    options: { gras?: boolean; italique?: boolean; taille?: number; couleur?: string; espaceApres?: number } = {},
  ): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: options.espaceApres ?? 100 },
      children: [
        new TextRun({
          text: texte,
          bold: options.gras,
          italics: options.italique,
          size: options.taille,
          color: options.couleur,
        }),
      ],
    });
  }
}
