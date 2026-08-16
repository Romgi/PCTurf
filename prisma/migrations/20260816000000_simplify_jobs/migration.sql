CREATE TABLE IF NOT EXISTS "TurfEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT OR IGNORE INTO "TurfEmployee" (
    "id", "name", "title", "active", "displayOrder", "createdAt", "updatedAt"
)
SELECT
    "id", "name", "title", "active", "displayOrder", "createdAt", "updatedAt"
FROM "Employee";

CREATE INDEX IF NOT EXISTS "TurfEmployee_active_displayOrder_idx"
ON "TurfEmployee"("active", "displayOrder");

CREATE TABLE IF NOT EXISTS "JobAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobAssignment_planId_fkey"
        FOREIGN KEY ("planId") REFERENCES "DailyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobAssignment_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "TurfEmployee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "JobAssignment_planId_employeeId_key"
ON "JobAssignment"("planId", "employeeId");

INSERT OR IGNORE INTO "JobAssignment" (
    "id", "planId", "employeeId", "title", "createdAt", "updatedAt"
)
SELECT
    MIN("id"), "planId", "employeeId", MIN("title"), MIN("createdAt"), MAX("updatedAt")
FROM "Assignment"
GROUP BY "planId", "employeeId";

INSERT OR IGNORE INTO "DailyPlan" ("id", "date", "createdAt", "updatedAt")
SELECT
    'absence-plan-' || "id", "date", "createdAt", "updatedAt"
FROM "Absence";

INSERT OR IGNORE INTO "JobAssignment" (
    "id", "planId", "employeeId", "title", "createdAt", "updatedAt"
)
SELECT
    'absence-job-' || absence."id",
    plan."id",
    absence."employeeId",
    CASE
        WHEN absence."reason" IS NOT NULL AND TRIM(absence."reason") <> ''
            THEN 'Absent - ' || TRIM(absence."reason")
        ELSE 'Absent'
    END,
    absence."createdAt",
    absence."updatedAt"
FROM "Absence" AS absence
INNER JOIN "DailyPlan" AS plan ON plan."date" = absence."date";

CREATE INDEX IF NOT EXISTS "JobAssignment_employeeId_createdAt_idx"
ON "JobAssignment"("employeeId", "createdAt");
