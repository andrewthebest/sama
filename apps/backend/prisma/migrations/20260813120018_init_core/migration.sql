-- CreateEnum
CREATE TYPE "Role" AS ENUM ('UTILISATEUR', 'MODERATEUR', 'ADMINISTRATEUR');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SCENARIO', 'PARCOURS');

-- CreateEnum
CREATE TYPE "ThematiqueType" AS ENUM ('REFEMI', 'PERSONNALISEE');

-- CreateEnum
CREATE TYPE "GenerationJobStatut" AS ENUM ('EN_FILE', 'EN_COURS', 'TERMINE', 'ECHOUE');

-- CreateEnum
CREATE TYPE "GenerationEtape" AS ENUM ('CADRAGE_RECU', 'GENERATION_CONTENU', 'MISE_EN_FORME', 'FINALISATION');

-- CreateEnum
CREATE TYPE "SubscriptionStatut" AS ENUM ('ESSAI', 'ACTIF', 'EXPIRE', 'ANNULE');

-- CreateEnum
CREATE TYPE "PlanPeriode" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'UTILISATEUR',
    "organisation" TEXT,
    "pays" TEXT NOT NULL,
    "languePreferee" TEXT NOT NULL DEFAULT 'fr',
    "roleEmi" TEXT,
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prixCentimes" INTEGER NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "periode" "PlanPeriode" NOT NULL DEFAULT 'MENSUEL',
    "quotaScenarios" INTEGER NOT NULL,
    "quotaParcours" INTEGER NOT NULL,
    "quotaRessources" INTEGER NOT NULL,
    "essaiInclus" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "statut" "SubscriptionStatut" NOT NULL DEFAULT 'ESSAI',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "generationsUtilisees" INTEGER NOT NULL DEFAULT 0,
    "essaisGratuitsRestants" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "thematiqueType" "ThematiqueType" NOT NULL,
    "referentielRefemi" JSONB,
    "thematiqueLibre" TEXT,
    "objectifsLibres" TEXT,
    "parametresGeneration" JSONB NOT NULL,
    "versionCourante" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "numeroVersion" INTEGER NOT NULL,
    "contenu" JSONB NOT NULL,
    "noteDeVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "statut" "GenerationJobStatut" NOT NULL DEFAULT 'EN_FILE',
    "etape" "GenerationEtape",
    "progression" INTEGER NOT NULL DEFAULT 0,
    "demarreLe" TIMESTAMP(3),
    "termineLe" TIMESTAMP(3),
    "erreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "dureeReellePrevue" TEXT,
    "champsStructures" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_pays_idx" ON "User"("pays");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_statut_idx" ON "UserSubscription"("userId", "statut");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_pays_idx" ON "Document"("pays");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_numeroVersion_key" ON "DocumentVersion"("documentId", "numeroVersion");

-- CreateIndex
CREATE INDEX "GenerationJob_documentId_idx" ON "GenerationJob"("documentId");

-- CreateIndex
CREATE INDEX "Feedback_documentId_idx" ON "Feedback"("documentId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
