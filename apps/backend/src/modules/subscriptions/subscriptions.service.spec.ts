import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionsService } from "./subscriptions.service";

function creerPrismaMock() {
  return {
    userSubscription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe("SubscriptionsService", () => {
  let prisma: ReturnType<typeof creerPrismaMock>;
  let service: SubscriptionsService;

  beforeEach(() => {
    prisma = creerPrismaMock();
    service = new SubscriptionsService(prisma as unknown as PrismaService);
  });

  describe("creerEssaiGratuit", () => {
    it("crée un abonnement ESSAI avec 2 essais gratuits", async () => {
      prisma.userSubscription.create.mockResolvedValue({ id: "sub-1" });
      await service.creerEssaiGratuit("user-1");
      expect(prisma.userSubscription.create).toHaveBeenCalledWith({
        data: { userId: "user-1", statut: "ESSAI", essaisGratuitsRestants: 2 },
      });
    });
  });

  describe("consommerQuota", () => {
    it("rejette si l'utilisateur n'a aucun abonnement", async () => {
      prisma.userSubscription.findFirst.mockResolvedValue(null);
      await expect(service.consommerQuota("user-1")).rejects.toThrow(ForbiddenException);
    });

    it("incrémente generationsUtilisees et retourne le type ABONNEMENT quand le statut est ACTIF", async () => {
      prisma.userSubscription.findFirst.mockResolvedValue({ id: "sub-1", statut: "ACTIF", essaisGratuitsRestants: 0 });
      prisma.userSubscription.update.mockResolvedValue({});

      const resultat = await service.consommerQuota("user-1");

      expect(prisma.userSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { generationsUtilisees: { increment: 1 } },
      });
      expect(resultat).toEqual({ subscriptionId: "sub-1", type: "ABONNEMENT" });
    });

    it("décrémente essaisGratuitsRestants et retourne le type ESSAI quand un essai reste disponible", async () => {
      prisma.userSubscription.findFirst.mockResolvedValue({ id: "sub-1", statut: "ESSAI", essaisGratuitsRestants: 2 });
      prisma.userSubscription.update.mockResolvedValue({});

      const resultat = await service.consommerQuota("user-1");

      expect(prisma.userSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { essaisGratuitsRestants: { decrement: 1 } },
      });
      expect(resultat).toEqual({ subscriptionId: "sub-1", type: "ESSAI" });
    });

    it("rejette (403) quand l'essai est épuisé et l'abonnement n'est pas actif", async () => {
      prisma.userSubscription.findFirst.mockResolvedValue({ id: "sub-1", statut: "EXPIRE", essaisGratuitsRestants: 0 });
      await expect(service.consommerQuota("user-1")).rejects.toThrow(ForbiddenException);
      expect(prisma.userSubscription.update).not.toHaveBeenCalled();
    });
  });

  describe("rembourserQuota", () => {
    it("incrémente essaisGratuitsRestants pour un remboursement d'origine ESSAI", async () => {
      await service.rembourserQuota("sub-1", "ESSAI");
      expect(prisma.userSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { essaisGratuitsRestants: { increment: 1 } },
      });
    });

    it("décrémente generationsUtilisees pour un remboursement d'origine ABONNEMENT", async () => {
      await service.rembourserQuota("sub-1", "ABONNEMENT");
      expect(prisma.userSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { generationsUtilisees: { decrement: 1 } },
      });
    });
  });

  describe("listerPlansActifs", () => {
    it("ne retourne que les plans actifs, triés par prix croissant", async () => {
      prisma.plan.findMany.mockResolvedValue([]);
      await service.listerPlansActifs();
      expect(prisma.plan.findMany).toHaveBeenCalledWith({ where: { actif: true }, orderBy: { prixCentimes: "asc" } });
    });
  });
});
