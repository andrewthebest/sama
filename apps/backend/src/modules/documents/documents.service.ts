import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Document, DocumentVersion } from "@prisma/client";
import { DocumentEntity, DocumentVersionEntity } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDocumentInput } from "./documents.types";

/**
 * Service du module `documents` — persistance des scénarios/parcours
 * générés, historique de versions, rattachement à un utilisateur.
 *
 * Le module `generation` est le seul consommateur autorisé à créer un
 * document et sa première version : il le fait via les méthodes
 * publiques de ce service plutôt qu'en écrivant directement dans la
 * table `Document` (règle de cloisonnement, voir README racine).
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crée un document « coquille », sans contenu, avant le lancement de sa génération. */
  async create(input: CreateDocumentInput): Promise<Document> {
    return this.prisma.document.create({ data: input });
  }

  /**
   * Ajoute une nouvelle version au document et la promeut en version
   * courante. Conserve les versions précédentes pour l'historique
   * (aucune suppression), conformément à l'entité `DocumentVersion` du
   * cahier des charges.
   */
  async ajouterVersion(documentId: string, contenu: unknown, noteDeVersion?: string): Promise<DocumentVersion> {
    const document = await this.prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    const numeroVersion = document.versionCourante;

    const [version] = await this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: { documentId, numeroVersion, contenu: contenu as object, noteDeVersion },
      }),
      this.prisma.document.update({
        where: { id: documentId },
        data: { versionCourante: numeroVersion },
      }),
    ]);

    return version;
  }

  async findAllForUser(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Retourne un document et sa version courante, en vérifiant que l'utilisateur en est bien le propriétaire. */
  async findOneForUser(id: string, userId: string): Promise<{ document: Document; versionCourante: DocumentVersion | null }> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException("Document introuvable.");
    }
    if (document.userId !== userId) {
      throw new ForbiddenException("Ce document ne vous appartient pas.");
    }

    const versionCourante = await this.prisma.documentVersion.findUnique({
      where: { documentId_numeroVersion: { documentId: id, numeroVersion: document.versionCourante } },
    });

    return { document, versionCourante };
  }

  toPublicEntity(document: Document): DocumentEntity {
    return {
      id: document.id,
      type: document.type as DocumentEntity["type"],
      userId: document.userId,
      titre: document.titre,
      pays: document.pays,
      thematiqueType: document.thematiqueType as DocumentEntity["thematiqueType"],
      referentielRefemi: document.referentielRefemi as unknown as DocumentEntity["referentielRefemi"],
      thematiqueLibre: document.thematiqueLibre,
      objectifsLibres: document.objectifsLibres,
      parametresGeneration: document.parametresGeneration as unknown as DocumentEntity["parametresGeneration"],
      versionCourante: document.versionCourante,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  toPublicVersionEntity(version: DocumentVersion): DocumentVersionEntity {
    return {
      id: version.id,
      documentId: version.documentId,
      numeroVersion: version.numeroVersion,
      contenu: version.contenu,
      noteDeVersion: version.noteDeVersion,
      createdAt: version.createdAt.toISOString(),
    };
  }
}
