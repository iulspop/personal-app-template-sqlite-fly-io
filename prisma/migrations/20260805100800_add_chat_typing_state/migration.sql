-- CreateTable
CREATE TABLE "ChatTypingState" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("conversationId", "userId"),
    CONSTRAINT "ChatTypingState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatTypingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ChatTypingState_expiresAt_idx" ON "ChatTypingState"("expiresAt");

-- CreateIndex
CREATE INDEX "ChatTypingState_userId_expiresAt_idx" ON "ChatTypingState"("userId", "expiresAt");
