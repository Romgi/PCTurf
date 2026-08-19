import "dotenv/config";

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { PrismaClient } from "@prisma/client";

const sourcePath = resolve(process.argv[2] ?? "prisma/dev.db");
const targetUrl = process.env.TARGET_DATABASE_URL?.trim();

if (!existsSync(sourcePath)) {
  throw new Error(`SQLite source database not found at ${sourcePath}.`);
}

if (!targetUrl || !/^postgres(?:ql)?:\/\//i.test(targetUrl)) {
  throw new Error("TARGET_DATABASE_URL must be set to the destination PostgreSQL connection string.");
}

const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
const prisma = new PrismaClient({ datasourceUrl: targetUrl });

function rows(table, columns) {
  return sqlite.prepare(`SELECT ${columns.join(", ")} FROM "${table}"`).all();
}

function timestamp(value, field) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} timestamp in the SQLite database.`);
  }

  return date;
}

async function importData() {
  const admins = rows("AdminUser", ["id", "name", "email", "passwordHash", "createdAt", "updatedAt"]);
  const employees = rows("TurfEmployee", ["id", "name", "title", "active", "displayOrder", "createdAt", "updatedAt"]);
  const plans = rows("DailyPlan", ["id", "date", "notes", "weather", "createdAt", "updatedAt"]);
  const assignments = rows("JobAssignment", ["id", "planId", "employeeId", "title", "createdAt", "updatedAt"]);
  const planIds = new Map();

  for (const admin of admins) {
    await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        passwordHash: admin.passwordHash,
        updatedAt: timestamp(admin.updatedAt, "administrator updatedAt"),
      },
      create: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        passwordHash: admin.passwordHash,
        createdAt: timestamp(admin.createdAt, "administrator createdAt"),
        updatedAt: timestamp(admin.updatedAt, "administrator updatedAt"),
      },
    });
  }

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { id: employee.id },
      update: {
        name: employee.name,
        title: employee.title,
        active: Boolean(employee.active),
        displayOrder: Number(employee.displayOrder),
        updatedAt: timestamp(employee.updatedAt, "employee updatedAt"),
      },
      create: {
        id: employee.id,
        name: employee.name,
        title: employee.title,
        active: Boolean(employee.active),
        displayOrder: Number(employee.displayOrder),
        createdAt: timestamp(employee.createdAt, "employee createdAt"),
        updatedAt: timestamp(employee.updatedAt, "employee updatedAt"),
      },
    });
  }

  for (const plan of plans) {
    const importedPlan = await prisma.dailyPlan.upsert({
      where: { date: plan.date },
      update: {
        notes: plan.notes,
        weather: plan.weather,
        updatedAt: timestamp(plan.updatedAt, "daily plan updatedAt"),
      },
      create: {
        id: plan.id,
        date: plan.date,
        notes: plan.notes,
        weather: plan.weather,
        createdAt: timestamp(plan.createdAt, "daily plan createdAt"),
        updatedAt: timestamp(plan.updatedAt, "daily plan updatedAt"),
      },
      select: { id: true },
    });

    planIds.set(plan.id, importedPlan.id);
  }

  for (const assignment of assignments) {
    const planId = planIds.get(assignment.planId);

    if (!planId) {
      throw new Error(`Assignment ${assignment.id} references a missing daily plan.`);
    }

    await prisma.assignment.upsert({
      where: {
        planId_employeeId: {
          planId,
          employeeId: assignment.employeeId,
        },
      },
      update: {
        title: assignment.title,
        updatedAt: timestamp(assignment.updatedAt, "assignment updatedAt"),
      },
      create: {
        id: assignment.id,
        planId,
        employeeId: assignment.employeeId,
        title: assignment.title,
        createdAt: timestamp(assignment.createdAt, "assignment createdAt"),
        updatedAt: timestamp(assignment.updatedAt, "assignment updatedAt"),
      },
    });
  }

  console.log(
    `Imported ${admins.length} admin(s), ${employees.length} employee(s), ${plans.length} plan(s), and ${assignments.length} assignment(s).`,
  );
}

try {
  await importData();
} finally {
  sqlite.close();
  await prisma.$disconnect();
}
