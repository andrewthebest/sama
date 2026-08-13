import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UserEntity } from "@sama-emi/contracts";

/**
 * Service du module `users`. Le module `auth` en dépend pour la lecture/
 * création de comptes ; il ne touche jamais directement la table `User`.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Recherche un utilisateur par email (insensible à la casse). */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  /** Recherche un utilisateur par identifiant. */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Persiste le hash du refresh token courant pour un utilisateur.
   *
   * Stocker un hash (et non le token en clair) permet de révoquer une
   * session compromise sans exposer de secret réutilisable si la base
   * est un jour lue par un tiers non autorisé.
   */
  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  /** Bascule la disponibilité d'un compte MODERATEUR pour être désigné sur de nouvelles ressources. */
  async definirDisponibiliteModeration(userId: string, disponible: boolean): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { disponiblePourModeration: disponible } });
  }

  /**
   * Désigne jusqu'à `nombre` modérateurs disponibles, par ordre
   * d'ancienneté d'assignation (jamais assigné, puis assigné il y a le
   * plus longtemps — `derniereAssignationModeration` croissant, `null`
   * en premier) : c'est l'interprétation retenue pour « désignation par
   * ordre de disponibilité » (cahier des charges, section 7a), qui
   * répartit équitablement la charge de modération entre modérateurs
   * disponibles plutôt que de toujours solliciter les mêmes.
   */
  async trouverModerateursDisponibles(nombre: number): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: "MODERATEUR", disponiblePourModeration: true },
      orderBy: [{ derniereAssignationModeration: { sort: "asc", nulls: "first" } }],
      take: nombre,
    });
  }

  /** Marque les modérateurs désignés comme venant d'être assignés — voir `trouverModerateursDisponibles`. */
  async marquerAssignationModeration(userIds: string[]): Promise<void> {
    await this.prisma.user.updateMany({ where: { id: { in: userIds } }, data: { derniereAssignationModeration: new Date() } });
  }

  /** Convertit une entité Prisma `User` vers la forme exposée par l'API (contrat public, sans secrets). */
  toPublicEntity(user: User): UserEntity {
    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role as UserEntity["role"],
      organisation: user.organisation,
      pays: user.pays,
      languePreferee: user.languePreferee,
      roleEmi: user.roleEmi,
      emailVerifie: user.emailVerifie,
      disponiblePourModeration: user.disponiblePourModeration,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
