import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Definí SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en el entorno antes de correr el seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.appUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, rol: "SuperAdmin", empresaId: null, employeeId: null },
    create: { email: email.toLowerCase(), passwordHash, rol: "SuperAdmin" },
  });

  console.log(`SuperAdmin listo: ${email}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
