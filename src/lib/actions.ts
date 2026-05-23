"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signInAdmin, signOutAdmin, requireAdmin } from "@/lib/auth";
import { isAssignmentStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ensureDailyPlan } from "@/lib/data";
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

async function assertEmployeeAvailable(date: string, employeeId: string) {
  const absence = await prisma.absence.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date,
      },
    },
    include: { employee: true },
  });

  if (absence) {
    throw new Error(`${absence.employee.name} is marked absent on ${date}.`);
  }
}

function revalidate() {
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

  revalidate();
}

export async function createAssignmentAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const title = text(formData, "title");
  const employeeId = text(formData, "employeeId");
  const categoryId = text(formData, "categoryId");
  const plan = await ensureDailyPlan(date);

  if (!title || !employeeId || !categoryId) {
    throw new Error("Assignment requires an employee, category, and job title.");
  }

  await assertEmployeeAvailable(date, employeeId);

  await prisma.assignment.create({
    data: {
      planId: plan.id,
      employeeId,
      categoryId,
      title,
      details: optionalText(formData, "details"),
      location: optionalText(formData, "location"),
      priority: "NORMAL",
    },
  });

  revalidate();
}

export async function createAssignmentFromTemplateAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const employeeId = text(formData, "employeeId");
  const templateId = text(formData, "templateId");
  const plan = await ensureDailyPlan(date);

  if (!employeeId || !templateId) {
    throw new Error("Choose an employee and a job template.");
  }

  await assertEmployeeAvailable(date, employeeId);

  const template = await prisma.jobTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("Job template not found.");
  }

  await prisma.assignment.create({
    data: {
      planId: plan.id,
      employeeId,
      categoryId: template.categoryId,
      title: template.title,
      details: template.details,
      location: template.location,
      priority: "NORMAL",
    },
  });

  revalidate();
}

export async function updateAssignmentAction(formData: FormData) {
  await requireAdmin();
  const date = normalizeDateKey(text(formData, "date"));
  const id = text(formData, "id");
  const title = text(formData, "title");
  const employeeId = text(formData, "employeeId");
  const categoryId = text(formData, "categoryId");

  if (!id || !title || !employeeId || !categoryId) {
    throw new Error("Assignment requires an employee, category, and job title.");
  }

  await assertEmployeeAvailable(date, employeeId);

  await prisma.assignment.update({
    where: { id },
    data: {
      employeeId,
      categoryId,
      title,
      details: optionalText(formData, "details"),
      location: optionalText(formData, "location"),
    },
  });

  revalidate();
}

export async function setAssignmentStatusAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");

  if (!id || !isAssignmentStatus(status)) {
    throw new Error("Invalid assignment status.");
  }

  await prisma.assignment.update({
    where: { id },
    data: { status },
  });

  revalidate();
}

export async function deleteAssignmentAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Assignment id is required.");
  }

  await prisma.assignment.delete({
    where: { id },
  });

  revalidate();
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
      radio: optionalText(formData, "radio"),
      categoryId: optionalText(formData, "categoryId"),
      displayOrder: intValue(formData, "displayOrder"),
    },
  });

  revalidate();
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

  revalidate();
}

export async function deleteEmployeeAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Employee id is required.");
  }

  await prisma.$transaction([
    prisma.assignment.deleteMany({ where: { employeeId: id } }),
    prisma.absence.deleteMany({ where: { employeeId: id } }),
    prisma.employee.delete({ where: { id } }),
  ]);

  revalidate();
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name");

  if (!name) {
    throw new Error("Category name is required.");
  }

  await prisma.category.create({
    data: {
      name,
      description: optionalText(formData, "description"),
      accentColor: optionalText(formData, "accentColor") ?? "#9a9d9d",
      displayOrder: intValue(formData, "displayOrder"),
    },
  });

  revalidate();
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new Error("Category not found.");
  }

  await prisma.category.update({
    where: { id },
    data: { active: !category.active },
  });

  revalidate();
}

export async function createTemplateAction(formData: FormData) {
  await requireAdmin();
  const title = text(formData, "title");
  const categoryId = text(formData, "categoryId");

  if (!title || !categoryId) {
    throw new Error("Template requires a title and category.");
  }

  await prisma.jobTemplate.create({
    data: {
      title,
      categoryId,
      details: optionalText(formData, "details"),
      location: optionalText(formData, "location"),
      displayOrder: intValue(formData, "displayOrder"),
    },
  });

  revalidate();
}

export async function createAbsenceAction(formData: FormData) {
  await requireAdmin();
  const employeeId = text(formData, "employeeId");
  const date = normalizeDateKey(text(formData, "absenceDate"));

  if (!employeeId) {
    throw new Error("Choose an employee for the absence.");
  }

  await prisma.absence.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date,
      },
    },
    update: {
      reason: optionalText(formData, "reason"),
      notes: optionalText(formData, "notes"),
    },
    create: {
      employeeId,
      date,
      reason: optionalText(formData, "reason"),
      notes: optionalText(formData, "notes"),
    },
  });

  revalidate();
}

export async function deleteAbsenceAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Absence id is required.");
  }

  await prisma.absence.delete({
    where: { id },
  });

  revalidate();
}

export async function toggleTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const template = await prisma.jobTemplate.findUnique({ where: { id } });

  if (!template) {
    throw new Error("Template not found.");
  }

  await prisma.jobTemplate.update({
    where: { id },
    data: { active: !template.active },
  });

  revalidate();
}
