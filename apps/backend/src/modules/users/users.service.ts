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
      createdAt: user.createdAt.toISOString(),
    };
  }
}
