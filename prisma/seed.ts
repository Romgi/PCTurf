import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function todayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIME_ZONE ?? "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "boss@pcturf.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: "Turf Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
    create: {
      name: "Turf Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  const employees = [
    ["Alex Martin", "Assistant Superintendent"],
    ["Sam Patel", "Crew Lead"],
    ["Jamie Brooks", null],
    ["Taylor Reed", null],
    ["Morgan Lee", null],
    ["Chris Evans", null],
    ["Jordan King", "Irrigation Technician"],
    ["Riley Chen", null],
  ] as const;

  for (const [index, [name, title]] of employees.entries()) {
    await prisma.employee.upsert({
      where: { id: `seed-employee-${index}` },
      update: {
        name,
        title,
        displayOrder: index,
        active: true,
      },
      create: {
        id: `seed-employee-${index}`,
        name,
        title,
        displayOrder: index,
      },
    });
  }

  const date = todayKey();
  const plan = await prisma.dailyPlan.upsert({
    where: { date },
    update: {},
    create: {
      date,
      notes: "Morning meeting at the shop before heading out.",
      weather: "Check radar before mowing low areas.",
    },
  });

  const seededAssignments = [
    ["seed-employee-0", "Mow greens"],
    ["seed-employee-1", "Roll greens"],
    ["seed-employee-2", "Mow fairways"],
    ["seed-employee-3", "Move tee markers"],
    ["seed-employee-4", "Rake bunkers"],
  ] as const;

  if ((await prisma.assignment.count({ where: { planId: plan.id } })) === 0) {
    await prisma.assignment.createMany({
      data: seededAssignments.map(([employeeId, title]) => ({
        planId: plan.id,
        employeeId,
        title,
      })),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
