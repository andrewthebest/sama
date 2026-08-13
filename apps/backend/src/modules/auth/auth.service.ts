import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuthResponseDto, AuthTokensDto } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crée un compte utilisateur puis son abonnement d'essai par défaut
   * (`SubscriptionsService.creerEssaiGratuit`) — effet de bord
   * obligatoire et non négociable de l'inscription (cahier des charges,
   * section 3.3).
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existant = await this.usersService.findByEmail(dto.email);
    if (existant) {
      throw new ConflictException("Un compte existe déjà avec cet email.");
    }

    const passwordHash = await argon2.hash(dto.motDePasse);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        nom: dto.nom,
        prenom: dto.prenom,
        pays: dto.pays.toUpperCase(),
        organisation: dto.organisation,
        languePreferee: dto.languePreferee ?? "fr",
        roleEmi: dto.roleEmi,
      },
    });
    await this.subscriptionsService.creerEssaiGratuit(user.id);

    const tokens = await this.emettreTokens(user.id, user.email, user.role);
    return { ...tokens, user: this.usersService.toPublicEntity(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const motDePasseValide = await argon2.verify(user.passwordHash, dto.motDePasse);
    if (!motDePasseValide) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const tokens = await this.emettreTokens(user.id, user.email, user.role);
    return { ...tokens, user: this.usersService.toPublicEntity(user) };
  }

  /**
   * Fait pivoter le refresh token : l'ancien est invalidé dès que le
   * nouveau est émis, qu'il ait été utilisé ou non. Cela limite la
   * fenêtre d'exploitation d'un refresh token volé à une seule
   * utilisation (rotation obligatoire imposée par le cahier des charges,
   * section 4.1).
   */
  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException("Session révoquée.");
    }

    const correspond = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!correspond) {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }

    return this.emettreTokens(user.id, user.email, user.role);
  }

  /** Révoque le refresh token courant (déconnexion). */
  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async emettreTokens(userId: string, email: string, role: string): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: userId, email, role: role as JwtPayload["role"] };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
        // La durée de vie est fournie par l'environnement (chaîne libre,
        // ex. "15m") : son format exact (`StringValue` de la lib `ms`)
        // n'est vérifiable qu'à l'exécution, pas statiquement.
        expiresIn: this.configService.get<string>("JWT_ACCESS_TTL", "15m") as JwtSignOptions["expiresIn"],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>("JWT_REFRESH_TTL", "30d") as JwtSignOptions["expiresIn"],
      }),
    ]);

    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.usersService.setRefreshTokenHash(userId, refreshTokenHash);

    return { accessToken, refreshToken };
  }
}
