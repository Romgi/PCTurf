import "server-only";

import { prisma } from "@/lib/db";
import { getTodayKey, normalizeDateKey } from "@/lib/dates";
import { getPortCarlingWeather } from "@/lib/weather";

export async function ensureDailyPlan(dateInput?: string | null) {
  const date = normalizeDateKey(dateInput);

  return prisma.dailyPlan.upsert({
    where: { date },
    update: {},
    create: { date },
  });
}

export async function getBoardData(dateInput?: string | null) {
  const date = normalizeDateKey(dateInput);
  const plan = await ensureDailyPlan(date);

  const [categories, employees, assignments, absences, weatherReport] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.employee.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.assignment.findMany({
      where: { planId: plan.id },
      include: { employee: true, category: true },
      orderBy: [{ employee: { displayOrder: "asc" } }, { createdAt: "asc" }],
    }),
    prisma.absence.findMany({
      where: { date },
      include: { employee: { include: { category: true } } },
      orderBy: [{ employee: { displayOrder: "asc" } }, { employee: { name: "asc" } }],
    }),
    getPortCarlingWeather(date),
  ]);

  const assignedEmployeeIds = new Set(assignments.map((assignment) => assignment.employeeId));
  const absentEmployeeIds = new Set(absences.map((absence) => absence.employeeId));
  const activeCategoryIds = new Set(categories.filter((category) => category.active).map((category) => category.id));
  const assignedCategoryIds = new Set(assignments.map((assignment) => assignment.categoryId));
  const presentEmployees = employees.filter((employee) => !absentEmployeeIds.has(employee.id));
  const employeeAssignments = presentEmployees.map((employee) => ({
    employee,
    assignments: assignments.filter((assignment) => assignment.employeeId === employee.id),
  }));
  const boardCategories = categories
    .filter((category) => category.active || assignedCategoryIds.has(category.id))
    .map((category) => ({
      ...category,
      assignments: assignments.filter((assignment) => assignment.categoryId === category.id),
    }))
    .filter((category) => category.assignments.length > 0 || activeCategoryIds.has(category.id));

  return {
    date,
    plan,
    categories: boardCategories,
    assignments,
    employees,
    absences,
    absentEmployeeIds: Array.from(absentEmployeeIds),
    employeeAssignments,
    weatherReport,
    unassignedEmployees: presentEmployees.filter((employee) => !assignedEmployeeIds.has(employee.id)),
  };
}

export type BoardData = Awaited<ReturnType<typeof getBoardData>>;

export async function getDashboardData(dateInput?: string | null) {
  const board = await getBoardData(dateInput);

  const [employees, categories, templates, recentPlans, upcomingAbsences] = await Promise.all([
    prisma.employee.findMany({
      include: { category: true },
      orderBy: [{ active: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.category.findMany({
      orderBy: [{ active: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.jobTemplate.findMany({
      include: { category: true },
      orderBy: [{ active: "desc" }, { displayOrder: "asc" }, { title: "asc" }],
    }),
    prisma.dailyPlan.findMany({
      orderBy: { date: "desc" },
      take: 12,
    }),
    prisma.absence.findMany({
      where: { date: { gte: getTodayKey() } },
      include: { employee: { include: { category: true } } },
      orderBy: [{ date: "asc" }, { employee: { displayOrder: "asc" } }],
      take: 20,
    }),
  ]);

  return {
    ...board,
    allEmployees: employees,
    allCategories: categories,
    templates,
    recentPlans,
    upcomingAbsences,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
