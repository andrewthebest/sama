import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ResourceDecision } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { ResourcesService } from "./resources.service";

function creerPrismaMock() {
  return {
    resource: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    resourceReview: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

function creerUsersServiceMock() {
  return {
    trouverModerateursDisponibles: jest.fn(),
    marquerAssignationModeration: jest.fn(),
  };
}

function ressource(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "res-1",
    statut: "EN_ATTENTE",
    moderateursAssignes: [] as string[],
    auteurId: "auteur-1",
    signalements: 0,
    ...overrides,
  };
}

describe("ResourcesService", () => {
  let prisma: ReturnType<typeof creerPrismaMock>;
  let usersService: ReturnType<typeof creerUsersServiceMock>;
  let service: ResourcesService;

  beforeEach(() => {
    prisma = creerPrismaMock();
    usersService = creerUsersServiceMock();
    service = new ResourcesService(prisma as unknown as PrismaService, usersService as unknown as UsersService);
  });

  describe("tenterAssignation", () => {
    it("laisse la ressource EN_ATTENTE si moins de 3 modérateurs sont disponibles", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource());
      usersService.trouverModerateursDisponibles.mockResolvedValue([{ id: "mod-1" }, { id: "mod-2" }]);

      const resultat = await service.tenterAssignation("res-1");

      expect(resultat.statut).toBe("EN_ATTENTE");
      expect(prisma.resource.update).not.toHaveBeenCalled();
      expect(usersService.marquerAssignationModeration).not.toHaveBeenCalled();
    });

    it("bascule EN_EXAMEN et assigne les 3 modérateurs quand ils sont disponibles", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource());
      usersService.trouverModerateursDisponibles.mockResolvedValue([{ id: "mod-1" }, { id: "mod-2" }, { id: "mod-3" }]);
      prisma.resource.update.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1", "mod-2", "mod-3"] }));

      const resultat = await service.tenterAssignation("res-1");

      expect(usersService.marquerAssignationModeration).toHaveBeenCalledWith(["mod-1", "mod-2", "mod-3"]);
      expect(prisma.resource.update).toHaveBeenCalledWith({
        where: { id: "res-1" },
        data: { statut: "EN_EXAMEN", moderateursAssignes: ["mod-1", "mod-2", "mod-3"] },
      });
      expect(resultat.statut).toBe("EN_EXAMEN");
    });

    it("est idempotente sur une ressource qui n'est plus EN_ATTENTE", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN" }));
      const resultat = await service.tenterAssignation("res-1");
      expect(resultat.statut).toBe("EN_EXAMEN");
      expect(usersService.trouverModerateursDisponibles).not.toHaveBeenCalled();
    });
  });

  describe("voter", () => {
    it("rejette si la ressource n'est pas EN_EXAMEN", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_ATTENTE" }));
      await expect(service.voter("res-1", "mod-1", { decision: ResourceDecision.VALIDER })).rejects.toThrow(ForbiddenException);
    });

    it("rejette si le modérateur n'est pas désigné sur cette ressource", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-2", "mod-3"] }));
      await expect(service.voter("res-1", "mod-1", { decision: ResourceDecision.VALIDER })).rejects.toThrow(ForbiddenException);
    });

    it("rejette un second vote du même modérateur (contrainte d'unicité)", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1"] }));
      prisma.resourceReview.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "7.9.1" }),
      );
      await expect(service.voter("res-1", "mod-1", { decision: ResourceDecision.VALIDER })).rejects.toThrow(ForbiddenException);
    });

    it("ne résout pas la ressource après un seul vote (quorum non atteint)", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1", "mod-2", "mod-3"] }));
      prisma.resourceReview.create.mockResolvedValue({});
      prisma.resourceReview.findMany.mockResolvedValue([{ decision: ResourceDecision.VALIDER }]);

      await service.voter("res-1", "mod-1", { decision: ResourceDecision.VALIDER });

      expect(prisma.resource.update).not.toHaveBeenCalled();
    });

    it("publie la ressource dès le 2e vote VALIDER, sans attendre le 3e avis", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1", "mod-2", "mod-3"] }));
      prisma.resourceReview.create.mockResolvedValue({});
      prisma.resourceReview.findMany.mockResolvedValue([{ decision: ResourceDecision.VALIDER }, { decision: ResourceDecision.VALIDER }]);
      prisma.resource.update.mockResolvedValue(ressource({ statut: "PUBLIEE" }));

      const resultat = await service.voter("res-1", "mod-2", { decision: ResourceDecision.VALIDER });

      expect(prisma.resource.update).toHaveBeenCalledWith({ where: { id: "res-1" }, data: { statut: "PUBLIEE" } });
      expect(resultat.statut).toBe("PUBLIEE");
    });

    it("rejette la ressource dès le 2e vote REJETER", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1", "mod-2", "mod-3"] }));
      prisma.resourceReview.create.mockResolvedValue({});
      prisma.resourceReview.findMany.mockResolvedValue([{ decision: ResourceDecision.REJETER }, { decision: ResourceDecision.REJETER }]);
      prisma.resource.update.mockResolvedValue(ressource({ statut: "REJETEE" }));

      await service.voter("res-1", "mod-2", { decision: ResourceDecision.REJETER });

      expect(prisma.resource.update).toHaveBeenCalledWith({ where: { id: "res-1" }, data: { statut: "REJETEE" } });
    });
  });

  describe("signaler", () => {
    it("rejette si la ressource n'est ni publiée ni déjà signalée", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN" }));
      await expect(service.signaler("res-1")).rejects.toThrow(ForbiddenException);
    });

    it("bascule une ressource publiée en SIGNALEE et incrémente le compteur", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "PUBLIEE", signalements: 0 }));
      prisma.resource.update.mockResolvedValue(ressource({ statut: "SIGNALEE", signalements: 1 }));

      await service.signaler("res-1");

      expect(prisma.resource.update).toHaveBeenCalledWith({
        where: { id: "res-1" },
        data: { statut: "SIGNALEE", signalements: { increment: 1 } },
      });
    });

    it("accepte un nouveau signalement sur une ressource déjà SIGNALEE (compteur cumulatif)", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "SIGNALEE", signalements: 1 }));
      prisma.resource.update.mockResolvedValue(ressource({ statut: "SIGNALEE", signalements: 2 }));
      await expect(service.signaler("res-1")).resolves.toBeDefined();
    });
  });

  describe("trouverParId", () => {
    it("lève NotFoundException si la ressource n'existe pas", async () => {
      prisma.resource.findUnique.mockResolvedValue(null);
      await expect(service.trouverParId("inexistant")).rejects.toThrow(NotFoundException);
    });
  });

  describe("trouverPourUtilisateur — règles de visibilité", () => {
    it("une ressource PUBLIEE est visible de tout utilisateur authentifié", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "PUBLIEE", auteurId: "quelqu-un-d-autre" }));
      await expect(service.trouverPourUtilisateur("res-1", { id: "tiers", role: "UTILISATEUR" } as any)).resolves.toBeDefined();
    });

    it("l'auteur voit sa ressource même EN_ATTENTE", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_ATTENTE", auteurId: "auteur-1" }));
      await expect(service.trouverPourUtilisateur("res-1", { id: "auteur-1", role: "UTILISATEUR" } as any)).resolves.toBeDefined();
    });

    it("le modérateur désigné voit la ressource EN_EXAMEN", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_EXAMEN", moderateursAssignes: ["mod-1"] }));
      await expect(service.trouverPourUtilisateur("res-1", { id: "mod-1", role: "MODERATEUR" } as any)).resolves.toBeDefined();
    });

    it("un administrateur voit toujours la ressource", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_ATTENTE" }));
      await expect(service.trouverPourUtilisateur("res-1", { id: "admin-1", role: "ADMINISTRATEUR" } as any)).resolves.toBeDefined();
    });

    it("un tiers non impliqué se voit refuser l'accès à une ressource EN_ATTENTE", async () => {
      prisma.resource.findUnique.mockResolvedValue(ressource({ statut: "EN_ATTENTE", auteurId: "auteur-1", moderateursAssignes: [] }));
      await expect(service.trouverPourUtilisateur("res-1", { id: "tiers", role: "UTILISATEUR" } as any)).rejects.toThrow(ForbiddenException);
    });
  });
});
