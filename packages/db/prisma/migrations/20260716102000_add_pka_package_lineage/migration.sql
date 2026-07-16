-- AlterTable
ALTER TABLE "PkaPackage" ADD COLUMN "replacementOfPackageId" TEXT;
ALTER TABLE "PkaPackage" ADD COLUMN "replacementSequence" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PkaPackage" ADD COLUMN "publishedAt" TIMESTAMP(3);
