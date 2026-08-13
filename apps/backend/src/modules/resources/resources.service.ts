import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Resource, User } from "@prisma/client";
import { CreateResourceRequestDto, ResourceEntity, ResourceType, VoteResourceRequestDto } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";

const NOMBRE_MODERATEURS_REQUIS = 3;
const QUORUM_DECISION = 2;

/**
 * Service du module `resources` — banque de ressources communautaire :
 * soumission, désignation de modérateurs, vote en aveugle à quorum 2/3,
 * signalement (cahier des charges, section 7a et 10).
 */
@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async soumettre(dto: CreateResourceRequestDto, auteurId: string): Promise<Resource> {
    const resource = await this.prisma.resource.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        type: dto.type,
        format: dto.format,
        contenu: dto.contenu,
        configJson: dto.configJson as object | undefined,
        competenceRefemi: dto.competenceRefemi as object | undefined,
        thematiqueLibre: dto.thematiqueLibre,
        pays: dto.pays.toUpperCase(),
        auteurId,
      },
    });
    return this.tenterAssignation(resource.id);
  }

  /**
   * Tente de désigner 3 modérateurs disponibles pour une ressource
   * `EN_ATTENTE` et bascule en `EN_EXAMEN` si le compte y est ; sinon la
   * ressource reste `EN_ATTENTE` (« moins de 3 modérateurs actifs »,
   * diagramme d'états du README). Idempotente sur une ressource qui
   * n'est plus `EN_ATTENTE`.
   */
  async tenterAssignation(resourceId: string): Promise<Resource> {
    const resource = await this.trouverParId(resourceId);
    if (resource.statut !== "EN_ATTENTE") {
      return resource;
    }

    const moderateurs = await this.usersService.trouverModerateursDisponibles(NOMBRE_MODERATEURS_REQUIS);
    if (moderateurs.length < NOMBRE_MODERATEURS_REQUIS) {
      return resource;
    }

    const ids = moderateurs.map((m) => m.id);
    await this.usersService.marquerAssignationModeration(ids);
    return this.prisma.resource.update({ where: { id: resourceId }, data: { statut: "EN_EXAMEN", moderateursAssignes: ids } });
  }

  /** Relance l'assignation de toutes les ressources encore `EN_ATTENTE` — déclenchement manuel, voir README (limite connue : pas de tâche planifiée dans cette session). */
  async relancerAssignationsEnAttente(): Promise<Resource[]> {
    const enAttente = await this.prisma.resource.findMany({ where: { statut: "EN_ATTENTE" } });
    const resultats: Resource[] = [];
    for (const r of enAttente) {
      resultats.push(await this.tenterAssignation(r.id));
    }
    return resultats;
  }

  /**
   * Enregistre le vote d'un modérateur désigné. Dès que 2 votes
   * concordants sont réunis, la ressource est immédiatement résolue
   * (`PUBLIEE` ou `REJETEE`) sans attendre le 3ᵉ avis — comportement
   * imposé par le diagramme d'états du cahier des charges.
   */
  async voter(resourceId: string, moderatorId: string, dto: VoteResourceRequestDto): Promise<Resource> {
    const resource = await this.trouverParId(resourceId);
    if (resource.statut !== "EN_EXAMEN") {
      throw new ForbiddenException("Cette ressource n'est pas en cours d'examen.");
    }
    if (!resource.moderateursAssignes.includes(moderatorId)) {
      throw new ForbiddenException("Vous n'êtes pas désigné modérateur de cette ressource.");
    }

    try {
      await this.prisma.resourceReview.create({
        data: { resourceId, moderatorId, decision: dto.decision, commentaire: dto.commentaire },
      });
    } catch (erreur) {
      if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002") {
        throw new ForbiddenException("Vous avez déjà voté sur cette ressource.");
      }
      throw erreur;
    }

    return this.resoudreSiQuorumAtteint(resourceId);
  }

  private async resoudreSiQuorumAtteint(resourceId: string): Promise<Resource> {
    const votes = await this.prisma.resourceReview.findMany({ where: { resourceId } });
    const valider = votes.filter((v) => v.decision === "VALIDER").length;
    const rejeter = votes.filter((v) => v.decision === "REJETER").length;

    if (valider >= QUORUM_DECISION) {
      return this.prisma.resource.update({ where: { id: resourceId }, data: { statut: "PUBLIEE" } });
    }
    if (rejeter >= QUORUM_DECISION) {
      return this.prisma.resource.update({ where: { id: resourceId }, data: { statut: "REJETEE" } });
    }
    return this.trouverParId(resourceId);
  }

  /** Une ressource publiée reste signalable par tout utilisateur ; le premier signalement bascule son statut en `SIGNALEE`. */
  async signaler(resourceId: string): Promise<Resource> {
    const resource = await this.trouverParId(resourceId);
    if (resource.statut !== "PUBLIEE" && resource.statut !== "SIGNALEE") {
      throw new ForbiddenException("Seule une ressource publiée peut être signalée.");
    }
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { statut: "SIGNALEE", signalements: { increment: 1 } },
    });
  }

  async listerPubliees(filtres: { pays?: string; type?: ResourceType }): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { statut: "PUBLIEE", pays: filtres.pays?.toUpperCase(), type: filtres.type },
      orderBy: { createdAt: "desc" },
    });
  }

  async listerMesRessources(auteurId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({ where: { auteurId }, orderBy: { createdAt: "desc" } });
  }

  /**
   * File de modération d'un modérateur : ses ressources `EN_EXAMEN` sur
   * lesquelles il n'a pas encore voté — jamais les votes de ses pairs
   * (vote en aveugle, cahier des charges section 7a).
   */
  async listerFileModeration(moderatorId: string): Promise<Resource[]> {
    const enExamen = await this.prisma.resource.findMany({
      where: { statut: "EN_EXAMEN", moderateursAssignes: { has: moderatorId } },
      orderBy: { createdAt: "asc" },
    });
    if (enExamen.length === 0) {
      return [];
    }
    const dejaVotees = await this.prisma.resourceReview.findMany({
      where: { moderatorId, resourceId: { in: enExamen.map((r) => r.id) } },
      select: { resourceId: true },
    });
    const idsDejaVotes = new Set(dejaVotees.map((v) => v.resourceId));
    return enExamen.filter((r) => !idsDejaVotes.has(r.id));
  }

  async trouverParId(id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundException("Ressource introuvable.");
    }
    return resource;
  }

  /**
   * Résout une ressource pour affichage en appliquant les règles de
   * visibilité : publiée/signalée (visible de tous), auteur, modérateur
   * désigné, ou administrateur. Sinon 403 — notamment pour empêcher un
   * tiers de lire une ressource encore `EN_ATTENTE`/`EN_EXAMEN`.
   */
  async trouverPourUtilisateur(id: string, user: User): Promise<Resource> {
    const resource = await this.trouverParId(id);
    const visible =
      resource.statut === "PUBLIEE" ||
      resource.statut === "SIGNALEE" ||
      resource.auteurId === user.id ||
      resource.moderateursAssignes.includes(user.id) ||
      user.role === "ADMINISTRATEUR";
    if (!visible) {
      throw new ForbiddenException("Cette ressource n'est pas accessible.");
    }
    return resource;
  }

  toPublicEntity(resource: Resource): ResourceEntity {
    return {
      id: resource.id,
      titre: resource.titre,
      description: resource.description,
      type: resource.type as ResourceEntity["type"],
      format: resource.format,
      contenu: resource.contenu,
      configJson: resource.configJson as Record<string, unknown> | null,
      competenceRefemi: resource.competenceRefemi as unknown as ResourceEntity["competenceRefemi"],
      thematiqueLibre: resource.thematiqueLibre,
      pays: resource.pays,
      auteurId: resource.auteurId,
      statut: resource.statut as ResourceEntity["statut"],
      moderateursAssignes: resource.moderateursAssignes,
      signalements: resource.signalements,
      dateSoumission: resource.dateSoumission.toISOString(),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };
  }
}
