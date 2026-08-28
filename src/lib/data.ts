import "server-only";

import { prisma } from "@/lib/db";
import { normalizeDateKey } from "@/lib/dates";
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

  const [employees, assignments, weatherReport, heightDefaults, previousStartTimePlan] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.assignment.findMany({
      where: { planId: plan.id },
      include: { employee: true },
      orderBy: [{ employee: { displayOrder: "asc" } }, { employee: { name: "asc" } }],
    }),
    getPortCarlingWeather(date),
    prisma.heightOfCutDefault.findUnique({ where: { id: "default" } }),
    prisma.dailyPlan.findFirst({
      where: {
        date: { lt: date },
        startTime: { not: null },
      },
      orderBy: { date: "desc" },
      select: { startTime: true },
    }),
  ]);

  const assignmentsByEmployee = new Map(
    assignments.map((assignment) => [assignment.employeeId, assignment]),
  );
  const employeeAssignments = employees.map((employee) => ({
    employee,
    assignment: assignmentsByEmployee.get(employee.id) ?? null,
  }));
  const effectivePlan = {
    ...plan,
    startTime: plan.startTime ?? previousStartTimePlan?.startTime ?? null,
    greensWalkHeight: plan.greensWalkHeight ?? heightDefaults?.greensWalkHeight ?? null,
    greensTriplexHeight: plan.greensTriplexHeight ?? heightDefaults?.greensTriplexHeight ?? null,
    greensCleanupHeight: plan.greensCleanupHeight ?? heightDefaults?.greensCleanupHeight ?? null,
    tcaTeesHeight: plan.tcaTeesHeight ?? heightDefaults?.tcaTeesHeight ?? null,
    tcaCollarsApproachesFairwaysHeight:
      plan.tcaCollarsApproachesFairwaysHeight
      ?? heightDefaults?.tcaCollarsApproachesFairwaysHeight
      ?? null,
    roughHeight: plan.roughHeight ?? heightDefaults?.roughHeight ?? null,
    roughSecondaryCutHeight:
      plan.roughSecondaryCutHeight ?? heightDefaults?.roughSecondaryCutHeight ?? null,
  };

  return {
    date,
    plan: effectivePlan,
    startTimeInherited: plan.startTime === null && effectivePlan.startTime !== null,
    assignments,
    employees,
    employeeAssignments,
    weatherReport,
    unassignedEmployees: employees.filter((employee) => !assignmentsByEmployee.has(employee.id)),
  };
}

export type BoardData = Awaited<ReturnType<typeof getBoardData>>;

type RankedJob = {
  count: number;
  title: string;
};

function recordJob(target: Map<string, RankedJob>, title: string) {
  const cleanedTitle = title.trim();
  if (!cleanedTitle) return;

  const key = cleanedTitle.toLocaleLowerCase();
  const existing = target.get(key);

  if (existing) {
    existing.count += 1;
  } else {
    target.set(key, { count: 1, title: cleanedTitle });
  }
}

function rankJobs(jobs: Map<string, RankedJob>, limit?: number) {
  const ranked = Array.from(jobs.values())
    .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
    .map((job) => job.title);

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

export async function getDashboardData(dateInput?: string | null) {
  const board = await getBoardData(dateInput);
  const [allEmployees, recentPlans, assignmentHistory, allAdmins] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.dailyPlan.findMany({
      orderBy: { date: "desc" },
      take: 12,
    }),
    prisma.assignment.findMany({
      select: { employeeId: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.adminUser.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
  ]);

  const globalJobs = new Map<string, RankedJob>();
  const jobsByEmployee = new Map<string, Map<string, RankedJob>>();

  for (const assignment of assignmentHistory) {
    recordJob(globalJobs, assignment.title);

    const employeeJobs = jobsByEmployee.get(assignment.employeeId) ?? new Map<string, RankedJob>();
    recordJob(employeeJobs, assignment.title);
    jobsByEmployee.set(assignment.employeeId, employeeJobs);
  }

  const allSuggestions = rankJobs(globalJobs).filter(
    (suggestion) => !["absent", "off"].includes(suggestion.toLocaleLowerCase()),
  );
  allSuggestions.unshift("Off");

  return {
    ...board,
    allEmployees,
    allAdmins,
    recentPlans,
    allSuggestions,
    assignmentRows: board.employeeAssignments.map(({ employee, assignment }) => ({
      employee: {
        id: employee.id,
        name: employee.name,
      },
      assignmentTitle:
        assignment?.title.trim().toLocaleLowerCase() === "absent"
          ? "Off"
          : (assignment?.title ?? ""),
      commonJobs: rankJobs(jobsByEmployee.get(employee.id) ?? new Map())
        .filter((suggestion) => !["absent", "off"].includes(suggestion.toLocaleLowerCase()))
        .slice(0, 5),
    })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
