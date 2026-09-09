-- AlterTable
ALTER TABLE "app_users" ALTER COLUMN "empresaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "fechaVencimiento" DATE,
ADD COLUMN     "maxAdmins" INTEGER NOT NULL DEFAULT 999999,
ADD COLUMN     "maxEmpleados" INTEGER NOT NULL DEFAULT 999999,
ADD COLUMN     "plan" TEXT;
