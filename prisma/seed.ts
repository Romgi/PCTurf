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

  const categories = [
    {
      name: "Greens",
      description: "Mowing, rolling, cups, and green detail.",
      accentColor: "#f4f1eb",
    },
    {
      name: "Tees & Approaches",
      description: "Tee decks, approaches, divots, and markers.",
      accentColor: "#d6d9d5",
    },
    {
      name: "Fairways",
      description: "Fairway mowing and presentation routes.",
      accentColor: "#c5cac7",
    },
    {
      name: "Bunkers",
      description: "Raking, edging, and bunker repair.",
      accentColor: "#b5b8b4",
    },
    {
      name: "Rough & Detail",
      description: "Rough mowing, trimming, paths, and detail work.",
      accentColor: "#a9adab",
    },
    {
      name: "Irrigation & Shop",
      description: "Water checks, repairs, equipment, and cleanup.",
      accentColor: "#9a9d9d",
    },
  ];

  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        ...category,
        displayOrder: index,
        active: true,
      },
      create: {
        ...category,
        displayOrder: index,
      },
    });
  }

  const allCategories = await prisma.category.findMany();
  const categoryByName = new Map(allCategories.map((category) => [category.name, category]));

  const employees = [
    ["Alex Martin", "Assistant Superintendent", "Greens"],
    ["Sam Patel", "Crew Lead", "Greens"],
    ["Jamie Brooks", "Equipment Operator", "Fairways"],
    ["Taylor Reed", "Turf Technician", "Tees & Approaches"],
    ["Morgan Lee", "Bunker Crew", "Bunkers"],
    ["Chris Evans", "Detail Crew", "Rough & Detail"],
    ["Jordan King", "Irrigation Tech", "Irrigation & Shop"],
    ["Riley Chen", "Turf Crew", "Rough & Detail"],
  ];

  for (const [index, [name, title, categoryName]] of employees.entries()) {
    const category = categoryByName.get(categoryName);

    await prisma.employee.upsert({
      where: { id: `seed-employee-${index}` },
      update: {
        name,
        title,
        categoryId: category?.id,
        displayOrder: index,
        active: true,
      },
      create: {
        id: `seed-employee-${index}`,
        name,
        title,
        categoryId: category?.id,
        displayOrder: index,
      },
    });
  }

  const templates = [
    ["Mow greens", "Greens", "Front nine route, check moisture before mowing.", "Greens", "05:30"],
    ["Roll greens", "Greens", "Single roll after cut unless conditions change.", "Greens", "06:15"],
    ["Move tee markers", "Tees & Approaches", "Set markers cleanly, repair divots after move.", "All tees", "06:00"],
    ["Mow fairways", "Fairways", "Follow daily route sheet and avoid wet low areas.", "Fairways", "05:45"],
    ["Rake bunkers", "Bunkers", "Hand finish faces and check washouts.", "Course bunkers", "06:30"],
    ["Trim paths", "Rough & Detail", "Focus clubhouse loop and high-traffic cart paths.", "Paths", "07:00"],
    ["Irrigation check", "Irrigation & Shop", "Inspect overnight cycles, flag leaks, update board.", "Pump house", "05:15"],
  ];

  for (const [index, [title, categoryName, details, location, defaultStartTime]] of templates.entries()) {
    const category = categoryByName.get(categoryName);

    if (!category) continue;

    const existing = await prisma.jobTemplate.findFirst({
      where: { title, categoryId: category.id },
    });

    if (existing) {
      await prisma.jobTemplate.update({
        where: { id: existing.id },
        data: {
          details,
          location,
          defaultStartTime,
          displayOrder: index,
          active: true,
        },
      });
    } else {
      await prisma.jobTemplate.create({
        data: {
          title,
          details,
          location,
          defaultStartTime,
          categoryId: category.id,
          displayOrder: index,
        },
      });
    }
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
    ["seed-employee-0", "Greens", "Mow greens", "Front nine, double check collars.", "Front nine", "05:30"],
    ["seed-employee-1", "Greens", "Roll greens", "Back nine roll after mow crew clears.", "Back nine", "06:15"],
    ["seed-employee-2", "Fairways", "Mow fairways", "Start on 1 and 10, radio if wet.", "Fairways", "05:45"],
    ["seed-employee-3", "Tees & Approaches", "Move tee markers", "Repair divots and square all blocks.", "All tees", "06:00"],
    ["seed-employee-4", "Bunkers", "Rake bunkers", "Prioritize member play corridors.", "Course bunkers", "06:30"],
  ];

  if ((await prisma.assignment.count({ where: { planId: plan.id } })) === 0) {
    for (const [index, [employeeId, categoryName, title, details, location, startTime]] of seededAssignments.entries()) {
      const category = categoryByName.get(categoryName);
      if (!category) continue;

      await prisma.assignment.create({
        data: {
          planId: plan.id,
          employeeId,
          categoryId: category.id,
          title,
          details,
          location,
          startTime,
          sortOrder: index,
        },
      });
    }
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
