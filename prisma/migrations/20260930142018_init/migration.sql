-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('received', 'replied', 'failed');

-- CreateEnum
CREATE TYPE "ActionKind" AS ENUM ('reply', 'mirror', 'ai');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'success', 'failed', 'retrying');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channelId" TEXT,
    "channels" JSONB NOT NULL DEFAULT '[]',
    "mirrorWebhook" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "command_configs" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "replyTemplate" TEXT NOT NULL DEFAULT '',
    "mirror" BOOLEAN NOT NULL DEFAULT false,
    "flagKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "useAiTriage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "command_configs_pkey" PRIMARY KEY ("guildId","name")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "InteractionStatus" NOT NULL DEFAULT 'received',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiSummary" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "kind" "ActionKind" NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "interactions_guildId_receivedAt_idx" ON "interactions"("guildId", "receivedAt");

-- CreateIndex
CREATE INDEX "interactions_command_idx" ON "interactions"("command");

-- CreateIndex
CREATE INDEX "interactions_status_idx" ON "interactions"("status");

-- CreateIndex
CREATE INDEX "actions_status_nextRetryAt_idx" ON "actions"("status", "nextRetryAt");

-- AddForeignKey
ALTER TABLE "command_configs" ADD CONSTRAINT "command_configs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
