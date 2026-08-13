import { DocumentType, ThematiqueType } from "@sama-emi/contracts";

/** Entrée de création d'un document « coquille » (avant génération de son contenu). */
export interface CreateDocumentInput {
  type: DocumentType;
  userId: string;
  titre: string;
  pays: string;
  thematiqueType: ThematiqueType;
  referentielRefemi?: object;
  thematiqueLibre?: string;
  objectifsLibres?: string;
  parametresGeneration: object;
}
