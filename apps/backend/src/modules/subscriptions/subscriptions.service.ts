import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Plan, UserSubscription } from "@prisma/client";
import { CreatePlanRequestDto, PlanEntity, SubscriptionStatut, UpdatePlanRequestDto, UserSubscriptionEntity } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { TypeConsommationQuota } from "./subscriptions.types";

/** Nombre d'essais gratuits accordés à l'inscription (cahier des charges, section 3.3). */
const ESSAIS_GRATUITS_A_INSCRIPTION = 2;

/**
 * Service du module `subscriptions` — plans, essais gratuits, décompte
 * et remboursement de quota. `auth` (création de l'essai) et
 * `generation` (décompte/remboursement) sont les seuls consommateurs
 * autorisés à passer par ce service plutôt que d'écrire directement
 * dans la table `UserSubscription` (règle de cloisonnement, voir README
 * racine).
 */
@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crée l'abonnement d'essai par défaut d'un nouvel utilisateur. Appelé par `AuthService.register`. */
  async creerEssaiGratuit(userId: string): Promise<UserSubscription> {
    return this.prisma.userSubscription.create({
      data: { userId, statut: "ESSAI", essaisGratuitsRestants: ESSAIS_GRATUITS_A_INSCRIPTION },
    });
  }

  /** Abonnement le plus récent de l'utilisateur (essai ou souscription), avec son plan résolu. */
  async trouverAbonnementCourant(userId: string): Promise<UserSubscription & { plan: Plan | null }> {
    const abonnement = await this.prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
    if (!abonnement) {
      throw new NotFoundException("Aucun abonnement associé à ce compte.");
    }
    return abonnement;
  }

  /**
   * Vérifie et décompte le quota disponible avant une génération
   * (cahier des charges, section 3.2, étape 3). Implémentation
   * minimale : seul l'essai gratuit puis l'abonnement actif sont
   * distingués — la grille de quotas par palier et par type de
   * génération (scénario/parcours/ressource) reste hors périmètre de
   * cette session (voir README de ce module).
   *
   * Retourne l'abonnement débité et l'origine de la consommation, pour
   * permettre un remboursement exact (`rembourserQuota`) si la
   * génération échoue définitivement.
   */
  async consommerQuota(userId: string): Promise<{ subscriptionId: string; type: TypeConsommationQuota }> {
    const abonnement = await this.prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!abonnement) {
      throw new ForbiddenException("Aucun abonnement ou essai associé à ce compte.");
    }

    if (abonnement.statut === "ACTIF") {
      await this.prisma.userSubscription.update({
        where: { id: abonnement.id },
        data: { generationsUtilisees: { increment: 1 } },
      });
      return { subscriptionId: abonnement.id, type: "ABONNEMENT" };
    }

    if (abonnement.essaisGratuitsRestants > 0) {
      await this.prisma.userSubscription.update({
        where: { id: abonnement.id },
        data: { essaisGratuitsRestants: { decrement: 1 } },
      });
      return { subscriptionId: abonnement.id, type: "ESSAI" };
    }

    // Politique de dépassement de quota validée en cadrage : blocage
    // (pas de report au mois suivant, pas d'achat à l'unité).
    throw new ForbiddenException("Quota de générations épuisé. Un abonnement actif est requis pour continuer.");
  }

  /**
   * Restitue la quota consommée par `consommerQuota` lorsque la
   * génération qu'elle finançait a échoué définitivement (voir
   * `generation.processor.ts`) — symétrique de `consommerQuota` :
   * incrémente ce qui avait été décrémenté, et inversement.
   */
  async rembourserQuota(subscriptionId: string, type: TypeConsommationQuota): Promise<void> {
    await this.prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: type === "ESSAI" ? { essaisGratuitsRestants: { increment: 1 } } : { generationsUtilisees: { decrement: 1 } },
    });
  }

  async listerPlansActifs(): Promise<Plan[]> {
    return this.prisma.plan.findMany({ where: { actif: true }, orderBy: { prixCentimes: "asc" } });
  }

  async creerPlan(dto: CreatePlanRequestDto): Promise<Plan> {
    return this.prisma.plan.create({ data: dto });
  }

  async modifierPlan(id: string, dto: UpdatePlanRequestDto): Promise<Plan> {
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  toPublicEntity(abonnement: UserSubscription): UserSubscriptionEntity {
    return {
      id: abonnement.id,
      userId: abonnement.userId,
      planId: abonnement.planId,
      statut: abonnement.statut as SubscriptionStatut,
      dateDebut: abonnement.dateDebut.toISOString(),
      dateFin: abonnement.dateFin?.toISOString() ?? null,
      generationsUtilisees: abonnement.generationsUtilisees,
      essaisGratuitsRestants: abonnement.essaisGratuitsRestants,
    };
  }

  toPublicPlanEntity(plan: Plan): PlanEntity {
    return {
      id: plan.id,
      nom: plan.nom,
      prixCentimes: plan.prixCentimes,
      devise: plan.devise,
      periode: plan.periode as PlanEntity["periode"],
      quotaScenarios: plan.quotaScenarios,
      quotaParcours: plan.quotaParcours,
      quotaRessources: plan.quotaRessources,
      essaiInclus: plan.essaiInclus,
      actif: plan.actif,
    };
  }
}
