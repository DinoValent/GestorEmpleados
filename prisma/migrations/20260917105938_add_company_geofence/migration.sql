-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION,
ADD COLUMN     "radioMetros" INTEGER DEFAULT 10;
