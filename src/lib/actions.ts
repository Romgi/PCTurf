"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import { ensureDailyPlan } from "@/lib/data";
import { prisma } from "@/lib/db";
import { normalizeDateKey } from "@/lib/dates";

export type ActionState = {
  error?: string;
  success?: string;
};

const adminAccountSchema = z.object({
  name: z.string().trim().min(2, "Enter the administrator's name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must be 128 characters or fewer.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

const optionalCutHeightSchema = z
  .string()
  .trim()
  .max(32, "Enter a shorter cutting height.")
  .refine(
    (value) => {
      if (!value) return true;
      if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return false;

      const height = Number(value);
      return Number.isFinite(height) && height > 0 && height <= 12;
    },
    "Enter a height greater than 0 and no more than 12 inches.",
  )
  .transform((value) => value || null);

const heightOfCutSchema = z.object({
  greensWalkHeight: optionalCutHeightSchema,
  greensTriplexHeight: optionalCutHeightSchema,
  greensCleanupHeight: optionalCutHeightSchema,
  tcaTeesHeight: optionalCutHeightSchema,
  tcaCollarsApproachesFairwaysHeight: optionalCutHeightSchema,
  roughHeight: optionalCutHeightSchema,
  roughSecondaryCutHeight: optionalCutHeightSchema,
});

const optionalStartTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Enter a valid start time.",
  )
  .transform((value) => value || null);

const emptyHeightOfCut = {
  greensWalkHeight: null,
  greensTriplexHeight: null,
  greensCleanupHeight: null,
  tcaTeesHeight: null,
  tcaCollarsApproachesFairwaysHeight: null,
  roughHeight: null,
  roughSecondaryCutHeight: null,
};

function dailyHeightOverride(value: string | null, defaultValue: string | null | undefined) {
  if (!value || !defaultValue) return value;
  return value === defaultValue ? null : value;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function revalidateBoards() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/present");
}

function requireConfirmation(formData: FormData, expected: string) {
  if (text(formData, "confirmation") !== expected) {
    throw new Error(`Type ${expected} to confirm this action.`);
  }
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  if (!email || !password) {
    return { error: "Enter an email and password." };
  }

  let success: boolean;

  try {
    success = await signInAdmin(email, password);
  } catch (error) {
    console.error("[auth] Administrator sign-in failed.", error);
    return { error: "Sign-in is temporarily unavailable. Try again in a moment." };
  }

  if (!success) {
    return { error: "The email or password is incorrect." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await signOutAdmin();
  redirect("/");
}

export async function updatePlanAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const plan = await ensureDailyPlan(date);

  await prisma.dailyPlan.update({
    where: { id: plan.id },
    data: {
      notes: optionalText(formData, "notes"),
      weather: optionalText(formData, "weather"),
    },
  });

  revalidateBoards();
}

export async function updateStartTimeAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const result = optionalStartTimeSchema.safeParse(text(formData, "startTime"));

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Enter a valid start time.");
  }

  const plan = await ensureDailyPlan(date);

  await prisma.dailyPlan.update({
    where: { id: plan.id },
    data: { startTime: result.data },
  });

  revalidateBoards();
}

export async function updateHeightOfCutAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const intent = text(formData, "heightIntent");
  const result = heightOfCutSchema.safeParse({
    greensWalkHeight: text(formData, "greensWalkHeight"),
    greensTriplexHeight: text(formData, "greensTriplexHeight"),
    greensCleanupHeight: text(formData, "greensCleanupHeight"),
    tcaTeesHeight: text(formData, "tcaTeesHeight"),
    tcaCollarsApproachesFairwaysHeight: text(formData, "tcaCollarsApproachesFairwaysHeight"),
    roughHeight: text(formData, "roughHeight"),
    roughSecondaryCutHeight: text(formData, "roughSecondaryCutHeight"),
  });

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Enter valid cutting heights.");
  }

  const plan = await ensureDailyPlan(date);

  if (intent === "default") {
    await prisma.$transaction([
      prisma.heightOfCutDefault.upsert({
        where: { id: "default" },
        update: result.data,
        create: { id: "default", ...result.data },
      }),
      prisma.dailyPlan.update({
        where: { id: plan.id },
        data: emptyHeightOfCut,
      }),
    ]);

    revalidateBoards();
    return;
  }

  const defaults = await prisma.heightOfCutDefault.findUnique({ where: { id: "default" } });

  await prisma.dailyPlan.update({
    where: { id: plan.id },
    data: {
      greensWalkHeight: dailyHeightOverride(result.data.greensWalkHeight, defaults?.greensWalkHeight),
      greensTriplexHeight: dailyHeightOverride(result.data.greensTriplexHeight, defaults?.greensTriplexHeight),
      greensCleanupHeight: dailyHeightOverride(result.data.greensCleanupHeight, defaults?.greensCleanupHeight),
      tcaTeesHeight: dailyHeightOverride(result.data.tcaTeesHeight, defaults?.tcaTeesHeight),
      tcaCollarsApproachesFairwaysHeight: dailyHeightOverride(
        result.data.tcaCollarsApproachesFairwaysHeight,
        defaults?.tcaCollarsApproachesFairwaysHeight,
      ),
      roughHeight: dailyHeightOverride(result.data.roughHeight, defaults?.roughHeight),
      roughSecondaryCutHeight: dailyHeightOverride(
        result.data.roughSecondaryCutHeight,
        defaults?.roughSecondaryCutHeight,
      ),
    },
  });

  revalidateBoards();
}

export async function saveAllAssignmentsAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const intent = text(formData, "intent");

  if (intent === "clear") {
    const plan = await prisma.dailyPlan.findUnique({
      where: { date },
      select: { id: true },
    });

    if (plan) {
      await prisma.assignment.deleteMany({ where: { planId: plan.id } });
    }

    revalidateBoards();
    return;
  }

  const employeeIds = Array.from(
    new Set(
      formData
        .getAll("employeeId")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  if (employeeIds.length === 0) {
    return;
  }

  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds }, active: true },
    select: { id: true },
  });

  if (employees.length !== employeeIds.length) {
    throw new Error("The employee list changed. Refresh the dashboard and try again.");
  }

  const plan = await ensureDailyPlan(date);

  await prisma.$transaction(async (transaction) => {
    for (const employeeId of employeeIds) {
      const title = text(formData, `assignment:${employeeId}`);

      if (title) {
        await transaction.assignment.upsert({
          where: {
            planId_employeeId: {
              planId: plan.id,
              employeeId,
            },
          },
          update: { title },
          create: { planId: plan.id, employeeId, title },
        });
      } else {
        await transaction.assignment.deleteMany({
          where: { planId: plan.id, employeeId },
        });
      }
    }
  });

  revalidateBoards();
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name");

  if (!name) {
    throw new Error("Employee name is required.");
  }

  const lastEmployee = await prisma.employee.aggregate({
    _max: { displayOrder: true },
  });

  await prisma.employee.create({
    data: {
      name,
      title: optionalText(formData, "title"),
      displayOrder: (lastEmployee._max.displayOrder ?? -1) + 1,
    },
  });

  revalidateBoards();
}

export async function updateEmployeeAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");

  if (!id || !name) {
    throw new Error("Employee id and name are required.");
  }

  await prisma.employee.update({
    where: { id },
    data: {
      name,
      title: optionalText(formData, "title"),
    },
  });

  revalidateBoards();
}

export async function reorderEmployeesAction(employeeIds: string[]) {
  await requireAdmin();

  if (!Array.isArray(employeeIds) || employeeIds.some((id) => typeof id !== "string" || !id)) {
    throw new Error("Invalid employee order.");
  }

  const uniqueIds = Array.from(new Set(employeeIds));
  if (uniqueIds.length !== employeeIds.length) {
    throw new Error("Employee order contains duplicates.");
  }

  const [employeeCount, totalEmployeeCount] = await Promise.all([
    prisma.employee.count({ where: { id: { in: uniqueIds } } }),
    prisma.employee.count(),
  ]);

  if (employeeCount !== uniqueIds.length || totalEmployeeCount !== uniqueIds.length) {
    throw new Error("Employee list changed. Refresh and try again.");
  }

  if (uniqueIds.length === 0) return;

  await prisma.$transaction(
    uniqueIds.map((id, displayOrder) =>
      prisma.employee.update({
        where: { id },
        data: { displayOrder },
      }),
    ),
  );

  revalidateBoards();
}

export async function toggleEmployeeAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const employee = await prisma.employee.findUnique({ where: { id } });

  if (!employee) {
    throw new Error("Employee not found.");
  }

  await prisma.employee.update({
    where: { id },
    data: { active: !employee.active },
  });

  revalidateBoards();
}

export async function deleteEmployeeAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Employee id is required.");
  }

  await prisma.employee.delete({ where: { id } });
  revalidateBoards();
}

export async function createAdminAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = adminAccountSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Enter valid administrator details." };
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: result.data.email },
    select: { id: true },
  });

  if (existing) {
    return { error: "An administrator already uses that email address." };
  }

  await prisma.adminUser.create({
    data: {
      name: result.data.name,
      email: result.data.email,
      passwordHash: await bcrypt.hash(result.data.password, 12),
    },
  });

  revalidatePath("/admin");
  return { success: `${result.data.email} can now sign in.` };
}

export async function deleteAdminAction(formData: FormData) {
  const currentAdmin = await requireAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Administrator id is required.");
  }

  if (id === currentAdmin.id) {
    throw new Error("You cannot delete the administrator account currently in use.");
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function clearEmployeesAction(formData: FormData) {
  await requireAdmin();
  requireConfirmation(formData, "CLEAR EMPLOYEES");

  await prisma.$transaction([
    prisma.assignment.deleteMany(),
    prisma.employee.deleteMany(),
  ]);

  revalidateBoards();
}

export async function clearRecentWorkDaysAction(formData: FormData) {
  await requireAdmin();
  requireConfirmation(formData, "CLEAR RECENT WORK DAYS");

  await prisma.$transaction([
    prisma.assignment.deleteMany(),
    prisma.dailyPlan.deleteMany(),
  ]);

  revalidateBoards();
}

export async function clearAllDataAction(formData: FormData) {
  const currentAdmin = await requireAdmin();
  requireConfirmation(formData, "CLEAR ALL DATA");

  await prisma.$transaction([
    prisma.assignment.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.dailyPlan.deleteMany(),
    prisma.heightOfCutDefault.deleteMany(),
    prisma.adminUser.deleteMany({ where: { id: { not: currentAdmin.id } } }),
  ]);

  revalidateBoards();
}
