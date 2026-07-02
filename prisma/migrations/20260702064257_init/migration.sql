-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'REVIEWER', 'ANALYST');

-- CreateEnum
CREATE TYPE "ProviderKey" AS ENUM ('MOCK', 'GEMINI', 'OPENAI', 'CLAUDE', 'DEEPSEEK', 'LLAMA', 'AZURE_OPENAI');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('JSON', 'TEXT', 'PDF');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "GovernanceRuleType" AS ENUM ('BANNED_WORD', 'PII', 'GROUNDING', 'THRESHOLD');

-- CreateEnum
CREATE TYPE "GovernanceAction" AS ENUM ('FLAG', 'BLOCK');

-- CreateEnum
CREATE TYPE "GovernanceStatus" AS ENUM ('PASS', 'FLAG', 'BLOCK');

-- CreateEnum
CREATE TYPE "PromptVariant" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "EvaluatorKind" AS ENUM ('MOCK', 'GEMINI');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "key" "ProviderKey" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isScaffold" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assistant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'mock-1',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knowledge" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'TEXT',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Untitled conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hallucinationRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "responseLength" INTEGER NOT NULL DEFAULT 0,
    "groundedSource" BOOLEAN NOT NULL DEFAULT false,
    "sourceReference" JSONB NOT NULL DEFAULT '[]',
    "correctnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evaluator" "EvaluatorKind" NOT NULL DEFAULT 'MOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTest" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Prompt A/B test',
    "promptA" TEXT NOT NULL,
    "promptB" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "winner" "PromptVariant",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTestResult" (
    "id" TEXT NOT NULL,
    "promptTestId" TEXT NOT NULL,
    "variant" "PromptVariant" NOT NULL,
    "output" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "FeedbackType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceRule" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT,
    "name" TEXT NOT NULL,
    "type" "GovernanceRuleType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "action" "GovernanceAction" NOT NULL DEFAULT 'FLAG',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_key_key" ON "Provider"("key");

-- CreateIndex
CREATE INDEX "Assistant_providerId_idx" ON "Assistant"("providerId");

-- CreateIndex
CREATE INDEX "Assistant_domain_idx" ON "Assistant"("domain");

-- CreateIndex
CREATE INDEX "Assistant_isActive_idx" ON "Assistant"("isActive");

-- CreateIndex
CREATE INDEX "Knowledge_assistantId_idx" ON "Knowledge"("assistantId");

-- CreateIndex
CREATE UNIQUE INDEX "Knowledge_assistantId_version_key" ON "Knowledge"("assistantId", "version");

-- CreateIndex
CREATE INDEX "Document_knowledgeId_idx" ON "Document"("knowledgeId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Conversation_assistantId_idx" ON "Conversation"("assistantId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_role_idx" ON "Message"("role");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_messageId_key" ON "Evaluation"("messageId");

-- CreateIndex
CREATE INDEX "Evaluation_messageId_idx" ON "Evaluation"("messageId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluator_idx" ON "Evaluation"("evaluator");

-- CreateIndex
CREATE INDEX "PromptTest_assistantId_idx" ON "PromptTest"("assistantId");

-- CreateIndex
CREATE INDEX "PromptTest_createdAt_idx" ON "PromptTest"("createdAt");

-- CreateIndex
CREATE INDEX "PromptTestResult_promptTestId_idx" ON "PromptTestResult"("promptTestId");

-- CreateIndex
CREATE INDEX "Feedback_messageId_idx" ON "Feedback"("messageId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_type_idx" ON "Feedback"("type");

-- CreateIndex
CREATE INDEX "GovernanceRule_assistantId_idx" ON "GovernanceRule"("assistantId");

-- CreateIndex
CREATE INDEX "GovernanceRule_type_idx" ON "GovernanceRule"("type");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_periodDate_idx" ON "AnalyticsSnapshot"("periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_assistantId_periodDate_key" ON "AnalyticsSnapshot"("assistantId", "periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTest" ADD CONSTRAINT "PromptTest_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTestResult" ADD CONSTRAINT "PromptTestResult_promptTestId_fkey" FOREIGN KEY ("promptTestId") REFERENCES "PromptTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceRule" ADD CONSTRAINT "GovernanceRule_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
