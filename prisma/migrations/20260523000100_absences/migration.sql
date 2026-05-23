-- CreateTable
CREATE TABLE IF NOT EXISTS "Absence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Absence_employeeId_date_key" ON "Absence"("employeeId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Absence_date_idx" ON "Absence"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Absence_employeeId_date_idx" ON "Absence"("employeeId", "date");
