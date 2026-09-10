/*
  Warnings:

  - You are about to drop the column `plan` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "plan",
ADD COLUMN     "diasGracia" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planLabel" TEXT;

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" TEXT NOT NULL,
    "precioOriginal" TEXT,
    "maxEmpleados" INTEGER NOT NULL,
    "maxAdmins" INTEGER NOT NULL,
    "diasGracia" INTEGER NOT NULL DEFAULT 5,
    "detalle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_planId_idx" ON "companies"("planId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
