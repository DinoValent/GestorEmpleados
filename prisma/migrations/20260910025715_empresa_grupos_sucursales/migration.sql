-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "grupoId" TEXT;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "esCorporativo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "empresa_grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresa_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_grupoId_idx" ON "companies"("grupoId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "empresa_grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
