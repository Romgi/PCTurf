-- CreateTable
CREATE TABLE "HeightOfCutDefault" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "greensWalkHeight" DECIMAL(5,3),
    "greensTriplexHeight" DECIMAL(5,3),
    "greensCleanupHeight" DECIMAL(5,3),
    "tcaTeesHeight" DECIMAL(5,3),
    "tcaCollarsApproachesFairwaysHeight" DECIMAL(5,3),
    "roughHeight" DECIMAL(5,3),
    "roughSecondaryCutHeight" DECIMAL(5,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeightOfCutDefault_pkey" PRIMARY KEY ("id")
);
