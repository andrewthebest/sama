/**
 * Erreur levée par `AnthropicGenerationClient`.
 *
 * `retryable` distingue les échecs transitoires (429, 5xx, coupure
 * réseau) — que la file BullMQ doit retenter avec un backoff
 * exponentiel — des échecs définitifs (400, 401, 403, schéma d'outil
 * invalide) qu'il est inutile de retenter. C'est `GenerationProcessor`
 * qui consulte ce champ pour décider de relancer le job ou de le
 * marquer `ECHOUE` immédiatement.
 */
export class AnthropicGenerationError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AnthropicGenerationError";
  }
}
