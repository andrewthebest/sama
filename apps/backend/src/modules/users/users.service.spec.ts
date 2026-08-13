import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "./users.service";

function creerPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe("UsersService", () => {
  let prisma: ReturnType<typeof creerPrismaMock>;
  let service: UsersService;

  beforeEach(() => {
    prisma = creerPrismaMock();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe("trouverModerateursDisponibles", () => {
    it("sélectionne des MODERATEUR disponibles, triés par ancienneté d'assignation (null en premier)", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.trouverModerateursDisponibles(3);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: "MODERATEUR", disponiblePourModeration: true },
        orderBy: [{ derniereAssignationModeration: { sort: "asc", nulls: "first" } }],
        take: 3,
      });
    });
  });

  describe("marquerAssignationModeration", () => {
    it("met à jour derniereAssignationModeration pour tous les identifiants fournis", async () => {
      await service.marquerAssignationModeration(["mod-1", "mod-2"]);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["mod-1", "mod-2"] } },
        data: { derniereAssignationModeration: expect.any(Date) },
      });
    });
  });

  describe("definirDisponibiliteModeration", () => {
    it("bascule disponiblePourModeration sur l'utilisateur", async () => {
      prisma.user.update.mockResolvedValue({ id: "user-1", disponiblePourModeration: true });
      await service.definirDisponibiliteModeration("user-1", true);
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { disponiblePourModeration: true } });
    });
  });
});
