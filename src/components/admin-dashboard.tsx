import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudSun,
  Database,
  KeyRound,
  LogOut,
  MonitorUp,
  Ruler,
  Trash2,
} from "lucide-react";

import { AdminAccountForm } from "@/components/admin-account-form";
import { AssignmentRoster } from "@/components/assignment-roster";
import { BrandLockup } from "@/components/brand-lockup";
import { EmployeeManager } from "@/components/employee-manager";
import { SubmitButton } from "@/components/submit-button";
import {
  clearAllDataAction,
  clearEmployeesAction,
  clearRecentWorkDaysAction,
  deleteAdminAction,
  logoutAction,
  updateHeightOfCutAction,
  updatePlanAction,
} from "@/lib/actions";
import type { DashboardData } from "@/lib/data";
import {
  formatDisplayDate,
  formatShortDate,
  getTodayKey,
  shiftDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/ui";

type AdminDashboardProps = {
  admin: {
    id: string;
    name: string;
    email: string;
  };
  data: DashboardData;
};

export function AdminDashboard({ admin, data }: AdminDashboardProps) {
  const today = getTodayKey();
  const previousDate = shiftDateKey(data.date, -1);
  const nextDate = shiftDateKey(data.date, 1);
  const assignedCount = data.employeeAssignments.filter(({ assignment }) => assignment).length;

  return (
    <main className="min-h-screen bg-[#333e3d] px-4 py-5 text-[#f4f1eb] sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-5 border-b border-white/12 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <BrandLockup href="/admin" />
          <div className="border-l border-white/12 pl-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">Operations</p>
            <h1 className="mt-1 text-2xl font-semibold">Superintendent Dashboard</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="nav-button gap-2" href={`/admin/present?date=${data.date}`}>
            <MonitorUp className="h-4 w-4" />
            Present
          </Link>
          <form action={logoutAction}>
            <SubmitButton className="gap-2" variant="ghost">
              <LogOut className="h-4 w-4" />
              Log out
            </SubmitButton>
          </form>
        </div>
      </header>

      <section className="mx-auto mt-5 flex max-w-[1680px] flex-col gap-4 border-b border-white/12 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">Selected work day</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{formatDisplayDate(data.date)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link aria-label="Previous day" className="nav-button w-10 px-0" href={`/admin?date=${previousDate}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link className="nav-button" href={`/admin?date=${today}`}>
            Today
          </Link>
          <Link aria-label="Next day" className="nav-button w-10 px-0" href={`/admin?date=${nextDate}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <form className="flex items-center gap-2" method="get">
            <input aria-label="Choose work day" className="input h-10 w-auto" defaultValue={data.date} name="date" type="date" />
            <button className="nav-button gap-2" type="submit">
              <CalendarDays className="h-4 w-4" />
              Go
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto mt-5 grid max-w-[1680px] items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.65fr)]">
        <div className="grid gap-5">
          <WeatherOverview data={data} />
          <HeightOfCut data={data} />
        </div>
        <DayOverview assignedCount={assignedCount} data={data} />
      </div>

      <section className="mx-auto mt-5 max-w-[1680px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#9a9d9d]">
              <ClipboardList className="h-4 w-4" />
              Daily roster
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Job assignments</h2>
          </div>
          <p className="max-w-xl text-sm text-[#9a9d9d]">
            Focus a field for that employee&apos;s common jobs, or type to search all previous assignments.
          </p>
        </div>
        <AssignmentRoster
          allSuggestions={data.allSuggestions}
          date={data.date}
          key={data.date}
          rows={data.assignmentRows}
        />
      </section>

      <div className="mx-auto mt-5 grid max-w-[1680px] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DailyNotes data={data} />
        <RecentDays data={data} />
      </div>

      <EmployeeManager
        initialEmployees={data.allEmployees.map((employee) => ({
          active: employee.active,
          displayOrder: employee.displayOrder,
          id: employee.id,
          name: employee.name,
          title: employee.title,
        }))}
        key={data.allEmployees
          .map((employee) => `${employee.id}:${employee.displayOrder}:${employee.active}:${employee.name}:${employee.title ?? ""}`)
          .join("|")}
      />
      <SystemAdministration currentAdminId={admin.id} data={data} />

      <footer className="mx-auto mt-8 max-w-[1680px] border-t border-white/10 pt-4 text-xs text-[#9a9d9d]">
        Signed in as {admin.name} ({admin.email})
      </footer>
    </main>
  );
}

function WeatherOverview({ data }: { data: DashboardData }) {
  const report = data.weatherReport;

  return (
    <section className="overflow-hidden rounded-md border border-white/12 bg-[#293231]">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#9a9d9d]">
            <CloudSun className="h-4 w-4" />
            {report.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{report.summary}</p>
        </div>
        {report.highLow ? <p className="text-sm font-semibold text-[#d8dad7]">{report.highLow}</p> : null}
      </div>
      {report.metrics.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {report.metrics.map((metric) => (
            <div className="border-b border-r border-white/8 px-4 py-3" key={metric.label}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#9a9d9d]">{metric.label}</p>
              <p className="mt-1 font-semibold text-[#f4f1eb]">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-5 text-sm text-[#9a9d9d]">Detailed weather data is currently unavailable.</p>
      )}
    </section>
  );
}

function HeightOfCut({ data }: { data: DashboardData }) {
  return (
    <section className="overflow-hidden rounded-md border border-white/12 bg-[#293231]">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#9a9d9d]">
          <Ruler className="h-4 w-4" />
          Height of Cut
        </p>
        <p className="mt-2 text-sm text-[#d8dad7]">Cutting heights for the selected work day, measured in inches.</p>
      </div>

      <form action={updateHeightOfCutAction}>
        <input name="date" type="hidden" value={data.date} />
        <div className="grid divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <CutHeightGroup title="Greens">
            <CutHeightField
              defaultValue={data.plan.greensWalkHeight?.toString() ?? ""}
              label="Walk"
              name="greensWalkHeight"
            />
            <CutHeightField
              defaultValue={data.plan.greensTriplexHeight?.toString() ?? ""}
              label="Triplex"
              name="greensTriplexHeight"
            />
            <CutHeightField
              defaultValue={data.plan.greensCleanupHeight?.toString() ?? ""}
              label="Cleanup"
              name="greensCleanupHeight"
            />
          </CutHeightGroup>

          <CutHeightGroup title="TCA">
            <CutHeightField
              defaultValue={data.plan.tcaTeesHeight?.toString() ?? ""}
              label="Tees"
              name="tcaTeesHeight"
            />
            <CutHeightField
              defaultValue={data.plan.tcaCollarsApproachesFairwaysHeight?.toString() ?? ""}
              label="Collars / approaches / fairways"
              name="tcaCollarsApproachesFairwaysHeight"
            />
          </CutHeightGroup>

          <CutHeightGroup title="Rough">
            <CutHeightField
              defaultValue={data.plan.roughHeight?.toString() ?? ""}
              label="Rough"
              name="roughHeight"
            />
            <CutHeightField
              defaultValue={data.plan.roughSecondaryCutHeight?.toString() ?? ""}
              label="Secondary cut"
              name="roughSecondaryCutHeight"
            />
          </CutHeightGroup>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#9a9d9d]">Use whole inches or decimals up to three places. Leave a field blank to clear it.</p>
          <SubmitButton className="shrink-0" pendingText="Saving heights">Save heights</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function CutHeightGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <fieldset className="min-w-0 px-5 py-4">
      <legend className="text-sm font-semibold text-[#f4f1eb]">{title}</legend>
      <div className="mt-3 grid gap-3">{children}</div>
    </fieldset>
  );
}

function CutHeightField({
  defaultValue,
  label,
  name,
}: {
  defaultValue: string;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[#d8dad7]">
      <span>{label}</span>
      <span className="relative block">
        <input
          aria-label={`${label} height in inches`}
          className="input w-full pr-9 tabular-nums"
          defaultValue={defaultValue}
          inputMode="decimal"
          max="12"
          min="0.001"
          name={name}
          placeholder="0.000"
          step="0.001"
          type="number"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[#9a9d9d]">
          in
        </span>
      </span>
    </label>
  );
}

function DayOverview({ assignedCount, data }: { assignedCount: number; data: DashboardData }) {
  return (
    <section className="rounded-md border border-white/12 bg-[#293231] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#9a9d9d]">Day overview</p>
      <p className="mt-3 text-lg font-semibold">
        {assignedCount} of {data.employees.length} active employees have a job posted.
      </p>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9a9d9d]">Still unassigned</p>
        <p className="mt-2 text-sm leading-6 text-[#d8dad7]">
          {data.unassignedEmployees.length > 0
            ? data.unassignedEmployees.map((employee) => employee.name).join(", ")
            : "Every active employee has an assignment."}
        </p>
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9a9d9d]">Course note</p>
        <p className="mt-2 text-sm leading-6 text-[#d8dad7]">{data.plan.weather || "No course or weather note posted."}</p>
      </div>
    </section>
  );
}

function DailyNotes({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-md border border-white/12 bg-[#293231] p-5">
      <h2 className="text-xl font-semibold">Board notes</h2>
      <form action={updatePlanAction} className="mt-4 grid gap-4">
        <input name="date" type="hidden" value={data.date} />
        <label className="grid gap-2 text-sm font-semibold">
          Course and weather note
          <textarea className="input min-h-24 resize-y" defaultValue={data.plan.weather ?? ""} name="weather" placeholder="Wet areas, frost delay, cart restrictions..." />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Superintendent note
          <textarea className="input min-h-24 resize-y" defaultValue={data.plan.notes ?? ""} name="notes" placeholder="Morning meeting or crew instructions..." />
        </label>
        <SubmitButton className="justify-self-start">Save notes</SubmitButton>
      </form>
    </section>
  );
}

function RecentDays({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-md border border-white/12 bg-[#293231] p-5">
      <h2 className="text-xl font-semibold">Recent work days</h2>
      <p className="mt-1 text-sm text-[#9a9d9d]">Open a previous or scheduled day to review and update its board.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.recentPlans.map((plan) => (
          <Link
            className={cn(
              "rounded-md border px-3 py-3 text-sm font-semibold transition hover:bg-white/[0.07]",
              plan.date === data.date
                ? "border-[#f4f1eb]/50 bg-white/[0.08]"
                : "border-white/10 bg-[#333e3d]",
            )}
            href={`/admin?date=${plan.date}`}
            key={plan.id}
          >
            {formatShortDate(plan.date)}
          </Link>
        ))}
      </div>
    </section>
  );
}

function SystemAdministration({ currentAdminId, data }: { currentAdminId: string; data: DashboardData }) {
  return (
    <section className="mx-auto mt-5 max-w-[1680px] border-t border-white/15 pt-6">
      <div className="flex items-center gap-3">
        <KeyRound className="h-5 w-5 text-[#9a9d9d]" />
        <div>
          <h2 className="text-xl font-semibold">System administration</h2>
          <p className="text-sm text-[#9a9d9d]">Manage administrator access and permanent data cleanup.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <section className="rounded-md border border-white/12 bg-[#293231] p-5">
          <h3 className="text-lg font-semibold">Administrator access</h3>
          <p className="mt-1 text-sm text-[#9a9d9d]">Add another superintendent or remove an account that should no longer have access.</p>
          <div className="mt-5 border-y border-white/10 py-5">
            <AdminAccountForm />
          </div>
          <div className="mt-4 grid gap-2">
            {data.allAdmins.map((account, index) => (
              <div
                className={cn(
                  "flex flex-col gap-3 rounded-md border border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  index % 2 === 0 ? "bg-[#333e3d]" : "bg-[#303938]",
                )}
                key={account.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{account.name}</p>
                  <p className="truncate text-sm text-[#9a9d9d]">{account.email}</p>
                </div>
                {account.id === currentAdminId ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9d9d]">Current account</span>
                ) : (
                  <form action={deleteAdminAction}>
                    <input name="id" type="hidden" value={account.id} />
                    <SubmitButton
                      confirmMessage={`Remove administrator access for ${account.email}?`}
                      variant="danger"
                    >
                      Remove access
                    </SubmitButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-red-300/20 bg-[#293231] p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-red-200" />
            <h3 className="text-lg font-semibold">Data cleanup</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#9a9d9d]">These actions are permanent. Type the displayed phrase and confirm the browser warning to continue.</p>
          <div className="mt-5 grid gap-4">
            <ResetControl
              action={clearRecentWorkDaysAction}
              description="Deletes every saved work day, including assignments and board notes. Employees and administrators remain."
              phrase="CLEAR RECENT WORK DAYS"
              title="Clear recent work days"
            />
            <ResetControl
              action={clearEmployeesAction}
              description="Deletes every employee and all assignment history attached to them. Board notes and administrators remain."
              phrase="CLEAR EMPLOYEES"
              title="Clear all employees"
            />
            <ResetControl
              action={clearAllDataAction}
              description="Deletes employees, assignments, dates, notes, legacy job data, and all additional administrators. Your current login is preserved to prevent lockout."
              phrase="CLEAR ALL DATA"
              title="Clear all data"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function ResetControl({
  action,
  description,
  phrase,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  description: string;
  phrase: string;
  title: string;
}) {
  return (
    <form action={action} className="rounded-md border border-white/10 bg-[#333e3d] p-4">
      <div className="flex items-start gap-3">
        <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#9a9d9d]">{description}</p>
        </div>
      </div>
      <label className="mt-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a9d9d]">
        Type &quot;{phrase}&quot;
        <input
          autoComplete="off"
          className="input normal-case tracking-normal"
          name="confirmation"
          pattern={phrase}
          required
        />
      </label>
      <SubmitButton
        className="mt-3"
        confirmMessage={`${title}? This cannot be undone.`}
        pendingText="Clearing"
        variant="danger"
      >
        {title}
      </SubmitButton>
    </form>
  );
}
