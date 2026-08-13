-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('FICHE_PEDAGOGIQUE', 'ETUDE_DE_CAS', 'SCRIPT_VIDEO', 'LIEN_EXTERNE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ResourceStatut" AS ENUM ('EN_ATTENTE', 'EN_EXAMEN', 'PUBLIEE', 'REJETEE', 'SIGNALEE');

-- CreateEnum
CREATE TYPE "ResourceDecision" AS ENUM ('VALIDER', 'REJETER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "derniereAssignationModeration" TIMESTAMP(3),
ADD COLUMN     "disponiblePourModeration" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "format" TEXT,
    "contenu" TEXT,
    "configJson" JSONB,
    "competenceRefemi" JSONB,
    "thematiqueLibre" TEXT,
    "pays" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "statut" "ResourceStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "moderateursAssignes" TEXT[],
    "signalements" INTEGER NOT NULL DEFAULT 0,
    "dateSoumission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceReview" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "decision" "ResourceDecision" NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resource_statut_idx" ON "Resource"("statut");

-- CreateIndex
CREATE INDEX "Resource_auteurId_idx" ON "Resource"("auteurId");

-- CreateIndex
CREATE INDEX "Resource_pays_idx" ON "Resource"("pays");

-- CreateIndex
CREATE INDEX "ResourceReview_resourceId_idx" ON "ResourceReview"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceReview_resourceId_moderatorId_key" ON "ResourceReview"("resourceId", "moderatorId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
