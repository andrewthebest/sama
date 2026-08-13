import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Conversion `.docx` → `.pdf` via LibreOffice headless (décision
 * validée en cadrage — voir le dossier d'architecture, section 12).
 *
 * Chaque conversion s'exécute dans un répertoire temporaire isolé,
 * supprimé après lecture du résultat, pour rester sûre sous des appels
 * concurrents (pas d'état partagé, pas de nom de fichier prévisible).
 */
@Injectable()
export class LibreOfficeConverterService {
  private readonly logger = new Logger(LibreOfficeConverterService.name);

  async convertirEnPdf(docxBuffer: Buffer): Promise<Buffer> {
    const dossierTemporaire = await mkdtemp(join(tmpdir(), "sama-emi-docx-"));
    const cheminDocx = join(dossierTemporaire, "document.docx");

    try {
      await writeFile(cheminDocx, docxBuffer);

      await execFileAsync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", dossierTemporaire, cheminDocx], {
        timeout: 60_000,
      });

      return await readFile(join(dossierTemporaire, "document.pdf"));
    } catch (erreur) {
      this.logger.error("Échec de la conversion .docx vers .pdf via LibreOffice", erreur as Error);
      throw new InternalServerErrorException("La conversion en PDF a échoué.");
    } finally {
      await rm(dossierTemporaire, { recursive: true, force: true });
    }
  }
}
