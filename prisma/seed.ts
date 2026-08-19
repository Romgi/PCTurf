import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to bootstrap the administrator account.`);
  }

  return value;
}

async function main() {
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Turf Admin";
  const email = required("SEED_ADMIN_EMAIL").toLowerCase();
  const password = required("SEED_ADMIN_PASSWORD");
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingAdmin) {
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: { name },
    });
    console.log(`Administrator ${email} is already configured.`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  console.log(`Administrator ${email} was created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
