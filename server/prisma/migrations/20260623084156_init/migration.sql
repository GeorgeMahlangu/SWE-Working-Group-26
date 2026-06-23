-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseReference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "paymentType" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "transactionStatus" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "routingQueue" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "decisionFactors" TEXT NOT NULL,
    "rulesEvaluated" TEXT NOT NULL,
    "fraudFlag" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME NOT NULL,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "originalAction" TEXT,
    "originalPriority" TEXT,
    "overrideReason" TEXT,
    "overriddenAt" DATETIME,
    "overriddenBy" TEXT,
    "resolutionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StatusTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "operatorId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusTransition_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_caseReference_key" ON "Dispute"("caseReference");

-- CreateIndex
CREATE INDEX "Dispute_priority_idx" ON "Dispute"("priority");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_paymentType_idx" ON "Dispute"("paymentType");

-- CreateIndex
CREATE INDEX "Dispute_issueCategory_idx" ON "Dispute"("issueCategory");

-- CreateIndex
CREATE INDEX "Dispute_recommendedAction_idx" ON "Dispute"("recommendedAction");

-- CreateIndex
CREATE INDEX "StatusTransition_disputeId_idx" ON "StatusTransition"("disputeId");
