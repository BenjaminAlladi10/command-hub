-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "interactionToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);
