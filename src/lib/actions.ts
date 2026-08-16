"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import { ensureDailyPlan } from "@/lib/data";
import { prisma } from "@/lib/db";
import { normalizeDateKey } from "@/lib/dates";

export type ActionState = {
  error?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function intValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function revalidateBoards() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/present");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  if (!email || !password) {
    return { error: "Enter an email and password." };
  }

  const success = await signInAdmin(email, password);

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

export async function saveEmployeeAssignmentAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const employeeId = text(formData, "employeeId");
  const title = text(formData, "intent") === "clear" ? "" : text(formData, "title");

  if (!employeeId) {
    throw new Error("Employee id is required.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!employee) {
    throw new Error("Employee not found.");
  }

  const plan = await ensureDailyPlan(date);

  if (!title) {
    await prisma.assignment.deleteMany({
      where: { planId: plan.id, employeeId },
    });
  } else {
    await prisma.assignment.upsert({
      where: {
        planId_employeeId: {
          planId: plan.id,
          employeeId,
        },
      },
      update: { title },
      create: {
        planId: plan.id,
        employeeId,
        title,
      },
    });
  }

  revalidateBoards();
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name");

  if (!name) {
    throw new Error("Employee name is required.");
  }

  await prisma.employee.create({
    data: {
      name,
      title: optionalText(formData, "title"),
      displayOrder: intValue(formData, "displayOrder"),
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
      displayOrder: intValue(formData, "displayOrder"),
    },
  });

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
