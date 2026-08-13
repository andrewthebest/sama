/**
 * DTO de requête/réponse du module `auth`.
 * Consommés par le backend (validation `class-validator`), le frontend
 * (typage des appels API) et les mocks MSW.
 */

import type { UserEntity } from "./entities";

export interface RegisterRequestDto {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  /** Obligatoire — sert à contextualiser les documents générés et à filtrer la banque de ressources. */
  pays: string;
  organisation?: string;
  languePreferee?: string;
  roleEmi?: string;
}

export interface LoginRequestDto {
  email: string;
  motDePasse: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserEntity;
}

export interface RefreshRequestDto {
  refreshToken: string;
}
