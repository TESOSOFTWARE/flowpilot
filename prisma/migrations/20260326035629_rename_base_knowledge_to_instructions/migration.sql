/*
  Warnings:

  - You are about to drop the column `baseKnowledge` on the `AiConfig` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "instructions" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AiConfig" ("apiKey", "createdAt", "id", "isEnabled", "organizationId", "provider", "updatedAt") SELECT "apiKey", "createdAt", "id", "isEnabled", "organizationId", "provider", "updatedAt" FROM "AiConfig";
DROP TABLE "AiConfig";
ALTER TABLE "new_AiConfig" RENAME TO "AiConfig";
CREATE UNIQUE INDEX "AiConfig_organizationId_key" ON "AiConfig"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
