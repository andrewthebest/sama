import { HttpResponse, http } from "msw";
import type {
  AuthResponseDto,
  CreateGenerationRequestDto,
  CreateGenerationResponseDto,
  DocumentEntity,
  DocumentVersionEntity,
  LoginRequestDto,
  RegisterRequestDto,
} from "@sama-emi/contracts";
import { DocumentType, GenerationJobStatut, ThematiqueType } from "@sama-emi/contracts";
import utilisateurFixture from "./fixtures/user.json";
import documentsFixtures from "./fixtures/documents.json";
import versionsFixtures from "./fixtures/document-versions.json";

/**
 * Base de données en mémoire du mode démonstration.
 *
 * Réinitialisée à chaque rechargement de page — c'est un choix
 * assumé : le mode démonstration sert à visualiser l'interface et à
 * faire des démonstrations, pas à persister un état entre sessions
 * (voir README racine, section « Mode démonstration »).
 */
const base = {
  utilisateur: { ...utilisateurFixture },
  documents: [...documentsFixtures] as DocumentEntity[],
  versions: { ...versionsFixtures } as Record<string, DocumentVersionEntity>,
};

let compteurDocuments = base.documents.length;

function reponseAuthFictive(): AuthResponseDto {
  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    user: base.utilisateur,
  };
}

/**
 * Construit un aperçu HTML à partir du contenu fictif d'un document,
 * pour servir `GET /documents/:id/apercu.html` en mode démonstration.
 * En mode connecté, ce même endpoint renvoie la conversion `mammoth`
 * du vrai `.docx` généré — le composant d'aperçu ne fait aucune
 * distinction entre les deux sources.
 */
function construireApercuHtmlDemo(contenu: Record<string, any>): string {
  const couverture = contenu.couverture ?? {};
  const sections = (contenu.sections ?? []) as Array<{ numero: number; titre: string; texte: string; tableauMock?: Array<Record<string, string>> }>;
  const geste = contenu.gestesProfessionnelsFormateur;

  const sectionsHtml = sections
    .map((section) => {
      const tableau = section.tableauMock
        ? `<table><tbody>${section.tableauMock
            .map((ligne) => `<tr>${Object.values(ligne).map((v) => `<td>${v}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        : "";
      return `<h2>${section.numero}. ${section.titre}</h2><p>${section.texte}</p>${tableau}`;
    })
    .join("");

  const gesteHtml = geste
    ? `<h3>${geste.titre}</h3>${geste.items.map((i: { libelle: string; texte: string }) => `<p><strong>${i.libelle}</strong><br/>${i.texte}</p>`).join("")}`
    : "";

  return [
    `<h1>${couverture.titre ?? ""}</h1>`,
    `<p><em>${couverture.citation ?? ""}</em></p>`,
    `<p>Pays : ${couverture.pays ?? ""} · Public : ${couverture.public ?? ""} · Durée : ${couverture.duree ?? ""} · Modalité : ${couverture.modalite ?? ""}</p>`,
    sectionsHtml,
    gesteHtml,
    `<p><em>${contenu.mentionIaARelire ?? ""}</em></p>`,
  ].join("\n");
}

export const handlers = [
  http.post("*/auth/register", async ({ request }) => {
    const dto = (await request.json()) as RegisterRequestDto;
    base.utilisateur = {
      ...base.utilisateur,
      email: dto.email,
      nom: dto.nom,
      prenom: dto.prenom,
      pays: dto.pays.toUpperCase(),
      organisation: dto.organisation ?? null,
      languePreferee: dto.languePreferee ?? "fr",
      roleEmi: dto.roleEmi ?? null,
    };
    return HttpResponse.json(reponseAuthFictive(), { status: 201 });
  }),

  http.post("*/auth/login", async ({ request }) => {
    const dto = (await request.json()) as LoginRequestDto;
    if (!dto.email || !dto.motDePasse) {
      return HttpResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }
    return HttpResponse.json(reponseAuthFictive());
  }),

  http.post("*/auth/refresh", () => {
    return HttpResponse.json({ accessToken: "mock-access-token", refreshToken: "mock-refresh-token" });
  }),

  http.post("*/auth/logout", () => new HttpResponse(null, { status: 204 })),

  http.get("*/users/me", () => HttpResponse.json(base.utilisateur)),

  http.get("*/documents", () => HttpResponse.json(base.documents)),

  http.get("*/documents/:id", ({ params }) => {
    const document = base.documents.find((d) => d.id === params.id);
    if (!document) {
      return HttpResponse.json({ message: "Document introuvable." }, { status: 404 });
    }
    return HttpResponse.json({ document, versionCourante: base.versions[document.id] ?? null });
  }),

  http.post("*/generations", async ({ request }) => {
    const dto = (await request.json()) as CreateGenerationRequestDto;
    compteurDocuments += 1;
    const documentId = `demo-doc-${compteurDocuments}`;
    const jobId = `demo-job-${compteurDocuments}`;
    const maintenant = new Date().toISOString();

    const sujet = dto.thematiqueType === ThematiqueType.PERSONNALISEE ? dto.thematiqueLibre : dto.referentielRefemi?.thematique;
    const titre = `${dto.type === DocumentType.PARCOURS ? "Parcours" : "Scénario"} — ${sujet ?? "Sans titre"}`;

    const document: DocumentEntity = {
      id: documentId,
      type: dto.type,
      userId: base.utilisateur.id,
      titre,
      pays: dto.pays.toUpperCase(),
      thematiqueType: dto.thematiqueType,
      referentielRefemi: dto.referentielRefemi ?? null,
      thematiqueLibre: dto.thematiqueLibre ?? null,
      objectifsLibres: dto.objectifsLibres ?? null,
      parametresGeneration: {
        public: dto.public,
        duree: dto.duree,
        modalite: dto.modalite,
        profilFormateur: dto.profilFormateur,
        niveau: dto.niveau ?? null,
        langue: dto.langue,
        nombreJours: dto.nombreJours ?? null,
        formatGlobal: dto.formatGlobal ?? null,
      },
      versionCourante: 1,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    base.documents.unshift(document);
    base.versions[documentId] = {
      id: `${documentId}-v1`,
      documentId,
      numeroVersion: 1,
      noteDeVersion: "Version initiale (mock démonstration)",
      createdAt: maintenant,
      contenu: {
        gabaritId: dto.type === DocumentType.PARCOURS ? "parcours" : "scenario",
        couverture: {
          titre,
          citation:
            dto.thematiqueType === ThematiqueType.PERSONNALISEE
              ? "Thématique personnalisée"
              : `REFEMI — ${dto.referentielRefemi?.culture} · ${dto.referentielRefemi?.competence}`,
          pays: document.pays,
          public: dto.public,
          duree: dto.duree,
          modalite: dto.modalite,
          profilFormateur: dto.profilFormateur,
          langue: dto.langue,
        },
        sections: [
          { numero: 1, id: "objectifs", titre: "Objectifs pédagogiques", texte: "[Contenu simulé — mode démonstration]" },
          { numero: 2, id: "public-contexte", titre: "Public et contexte", texte: "[Contenu simulé — mode démonstration]" },
          { numero: 3, id: "profil-formateur", titre: "Profil et compétences de transférabilité du formateur", texte: "[Contenu simulé — mode démonstration]" },
        ],
        gestesProfessionnelsFormateur: {
          titre: "🎯 Gestes professionnels du formateur",
          items: [
            { cle: "configurationSalle", libelle: "Configuration de la salle", texte: "Adaptez la disposition à l'activité prévue (cercle ou U pour les échanges collectifs, îlots pour le travail en petits groupes)." },
            { cle: "gestuelle", libelle: "Gestuelle", texte: "Déplacez-vous dans la salle plutôt que de rester statique, en particulier pendant les activités en groupe." },
            { cle: "voix", libelle: "Voix", texte: "Variez le débit et le volume selon les temps, et marquez une pause après chaque question posée au groupe." },
            { cle: "pedagogieDifferenciee", libelle: "Pédagogie différenciée", texte: "Combinez plusieurs canaux (oral, écrit, visuel) pour une même consigne." },
          ],
        },
        mentionIaARelire:
          "Ce document est une proposition assistée par intelligence artificielle. Il doit être relu et adapté par le formateur avant usage.",
      },
    };

    const reponse: CreateGenerationResponseDto = { jobId, documentId, statut: GenerationJobStatut.EN_FILE };
    return HttpResponse.json(reponse, { status: 201 });
  }),

  http.get("*/documents/:id/apercu.html", ({ params }) => {
    const version = base.versions[params.id as string];
    if (!version) {
      return HttpResponse.json({ message: "Document introuvable." }, { status: 404 });
    }
    return HttpResponse.json({ html: construireApercuHtmlDemo(version.contenu as Record<string, any>) });
  }),
];
