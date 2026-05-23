import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MonitorUp,
  Plus,
  TriangleAlert,
  Users,
} from "lucide-react";

import { BrandLockup } from "@/components/brand-lockup";
import { FullscreenButton } from "@/components/fullscreen-button";
import { SubmitButton } from "@/components/submit-button";
import {
  createAbsenceAction,
  createAssignmentAction,
  createAssignmentFromTemplateAction,
  createCategoryAction,
  createEmployeeAction,
  createTemplateAction,
  deleteAbsenceAction,
  deleteAssignmentAction,
  deleteEmployeeAction,
  logoutAction,
  setAssignmentStatusAction,
  toggleCategoryAction,
  toggleEmployeeAction,
  toggleTemplateAction,
  updateAssignmentAction,
  updatePlanAction,
} from "@/lib/actions";
import { ASSIGNMENT_STATUSES, STATUS_LABELS, type AssignmentStatus } from "@/lib/constants";
import type { DashboardData } from "@/lib/data";
import { formatDisplayDate, formatShortDate, getTodayKey, shiftDateKey } from "@/lib/dates";
import { cn } from "@/lib/ui";

type AdminDashboardProps = {
  data: DashboardData;
  admin: {
    name: string;
    email: string;
  };
};

type EmployeeOption = DashboardData["allEmployees"][number];
type CategoryOption = DashboardData["allCategories"][number];
type TemplateOption = DashboardData["templates"][number];

export function AdminDashboard({ data, admin }: AdminDashboardProps) {
  const activeEmployees = data.allEmployees.filter((employee) => employee.active);
  const activeCategories = data.allCategories.filter((category) => category.active);
  const activeTemplates = data.templates.filter((template) => template.active);
  const absentEmployeeIds = new Set(data.absentEmployeeIds);

  return (
    <main className="min-h-screen bg-[#333e3d] px-5 py-6 text-[#f4f1eb] lg:px-8">
      <header className="mx-auto flex max-w-[1600px] flex-col gap-5 border-b border-white/12 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <BrandLockup href="/admin" />
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Link
            href={`/admin/present?date=${data.date}`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#f4f1eb] px-4 text-sm font-semibold text-[#202827] transition hover:bg-white"
          >
            <MonitorUp className="h-4 w-4" />
            Present mode
          </Link>
          <FullscreenButton />
          <form action={logoutAction}>
            <SubmitButton variant="secondary" pendingText="Signing out">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </SubmitButton>
          </form>
        </div>
      </header>

      <section className="mx-auto mt-6 grid max-w-[1600px] gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-white/12 bg-[#293231] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[#9a9d9d]">
                <LayoutDashboard className="h-4 w-4" />
                Superintendent Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{formatDisplayDate(data.date)}</h1>
              <p className="mt-2 max-w-2xl text-[#9a9d9d]">
                Signed in as {admin.name}. Select any date to plan ahead or review saved job history.
              </p>
            </div>
            <DateNavigator date={data.date} />
          </div>
        </div>

        <div className="rounded-md border border-white/12 bg-[#293231] p-5">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[#9a9d9d]">
            <CalendarDays className="h-4 w-4" />
            Recent days
          </p>
          <div className="mt-4 grid gap-2">
            {data.recentPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/admin?date=${plan.date}`}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                  plan.date === data.date
                    ? "border-white/30 bg-white/[0.08] text-[#f4f1eb]"
                    : "border-white/10 text-[#9a9d9d] hover:bg-white/[0.05]",
                )}
              >
                <span>{formatShortDate(plan.date)}</span>
                <span>{plan.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {data.absences.length > 0 ? (
        <section className="mx-auto mt-4 max-w-[1600px] rounded-md border border-amber-200/20 bg-amber-950/20 p-4 text-amber-50">
          <p className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-4 w-4" />
            Absence notice for {formatDisplayDate(data.date)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.absences.map((absence) => (
              <span key={absence.id} className="rounded border border-amber-100/20 bg-[#333e3d] px-3 py-2 text-sm">
                {absence.employee.name}
                {absence.reason ? ` - ${absence.reason}` : ""}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-4 grid max-w-[1600px] gap-4 xl:grid-cols-3">
        <Panel title="Daily notes" eyebrow="Course condition">
          <form action={updatePlanAction} className="grid gap-4">
            <input type="hidden" name="date" value={data.date} />
            <Field label="Course / weather admin note">
              <textarea
                name="weather"
                rows={3}
                defaultValue={data.plan.weather ?? ""}
                className="input min-h-24"
                placeholder="Example: avoid low fairways until checked."
              />
            </Field>
            <Field label="Superintendent notes">
              <textarea
                name="notes"
                rows={3}
                defaultValue={data.plan.notes ?? ""}
                className="input min-h-24"
                placeholder="Example: morning meeting in the shop at 5:20."
              />
            </Field>
            <SubmitButton className="w-fit">Save daily notes</SubmitButton>
          </form>
        </Panel>

        <Panel title="Quick assignment" eyebrow="From saved job">
          <form action={createAssignmentFromTemplateAction} className="grid gap-4">
            <input type="hidden" name="date" value={data.date} />
            <Field label="Employee">
              <EmployeeSelect name="employeeId" employees={activeEmployees} absentEmployeeIds={absentEmployeeIds} required />
            </Field>
            <Field label="Saved job">
              <Select name="templateId" required>
                <option value="">Choose job</option>
                {activeTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title} ({template.category.name})
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton className="w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Add from template
            </SubmitButton>
          </form>
        </Panel>

        <Panel title="Absences" eyebrow="Reported time away">
          <AbsenceManager date={data.date} employees={activeEmployees} data={data} />
        </Panel>
      </section>

      <section className="mx-auto mt-4 grid max-w-[1600px] gap-4 xl:grid-cols-[420px_1fr]">
        <Panel title="Create custom job" eyebrow="Daily assignment">
          <AssignmentCreateForm
            date={data.date}
            employees={activeEmployees}
            categories={activeCategories}
            absentEmployeeIds={absentEmployeeIds}
          />
        </Panel>

        <Panel title="Today's assignments" eyebrow={`${data.assignments.length} posted jobs`}>
          <AssignmentList
            data={data}
            employees={activeEmployees}
            categories={activeCategories}
            absentEmployeeIds={absentEmployeeIds}
          />
        </Panel>
      </section>

      <section className="mx-auto mt-4 grid max-w-[1600px] gap-4 xl:grid-cols-3">
        <Panel title="Employees" eyebrow="Roster">
          <EmployeeManager date={data.date} employees={data.allEmployees} categories={activeCategories} />
        </Panel>

        <Panel title="Job categories" eyebrow="Board groups">
          <CategoryManager date={data.date} categories={data.allCategories} />
        </Panel>

        <Panel title="Saved jobs" eyebrow="Templates">
          <TemplateManager date={data.date} templates={data.templates} categories={activeCategories} />
        </Panel>
      </section>
    </main>
  );
}

function DateNavigator({ date }: { date: string }) {
  const today = getTodayKey();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin?date=${shiftDateKey(date, -1)}`} className="nav-button">
        Previous
      </Link>
      <Link href={`/admin?date=${today}`} className="nav-button">
        Today
      </Link>
      <Link href={`/admin?date=${shiftDateKey(date, 1)}`} className="nav-button">
        Next
      </Link>
      <form action="/admin" className="flex items-center gap-2">
        <input type="date" name="date" defaultValue={date} className="input h-10 w-[155px]" />
        <button type="submit" className="nav-button">
          Go
        </button>
      </form>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-white/12 bg-[#293231] p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#d8dad7]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Select({
  children,
  name,
  required,
  defaultValue,
}: {
  children: React.ReactNode;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <select name={name} required={required} defaultValue={defaultValue} className="input">
      {children}
    </select>
  );
}

function EmployeeSelect({
  name,
  employees,
  absentEmployeeIds,
  required,
  defaultValue,
}: {
  name: string;
  employees: EmployeeOption[];
  absentEmployeeIds: Set<string>;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <select name={name} required={required} defaultValue={defaultValue} className="input">
      <option value="">Choose employee</option>
      {employees.map((employee) => {
        const absent = absentEmployeeIds.has(employee.id);
        const disabled = absent && employee.id !== defaultValue;

        return (
          <option key={employee.id} value={employee.id} disabled={disabled}>
            {employee.name}
            {absent ? " (absent)" : ""}
          </option>
        );
      })}
    </select>
  );
}

function AbsenceManager({ date, employees, data }: { date: string; employees: EmployeeOption[]; data: DashboardData }) {
  return (
    <div className="grid gap-5">
      <form action={createAbsenceAction} className="grid gap-3">
        <Field label="Employee">
          <Select name="employeeId" required>
            <option value="">Choose employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Absent date">
          <input name="absenceDate" type="date" defaultValue={date} className="input" required />
        </Field>
        <Field label="Reason">
          <input name="reason" className="input" placeholder="Sick, vacation, appointment" />
        </Field>
        <Field label="Notes">
          <textarea name="notes" rows={3} className="input min-h-24" placeholder="Optional details." />
        </Field>
        <SubmitButton className="w-fit">Save absence</SubmitButton>
      </form>

      <div>
        <p className="text-sm font-semibold text-[#d8dad7]">Selected day</p>
        <AbsenceList absences={data.absences} emptyText="No absences recorded for this day." />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#d8dad7]">Upcoming</p>
        <AbsenceList absences={data.upcomingAbsences} emptyText="No upcoming absences recorded." />
      </div>
    </div>
  );
}

function AbsenceList({
  absences,
  emptyText,
}: {
  absences: DashboardData["absences"] | DashboardData["upcomingAbsences"];
  emptyText: string;
}) {
  if (absences.length === 0) {
    return <p className="mt-2 rounded-md border border-dashed border-white/12 p-3 text-sm text-[#9a9d9d]">{emptyText}</p>;
  }

  return (
    <ul className="mt-2 grid gap-2">
      {absences.map((absence) => (
        <li key={absence.id} className="entity-row">
          <div>
            <p className="font-semibold">{absence.employee.name}</p>
            <p className="text-sm text-[#9a9d9d]">
              {absence.date}
              {absence.reason ? ` / ${absence.reason}` : ""}
            </p>
          </div>
          <form action={deleteAbsenceAction}>
            <input type="hidden" name="id" value={absence.id} />
            <SubmitButton variant="secondary" className="h-8 px-3 text-xs" pendingText="Removing">
              Remove
            </SubmitButton>
          </form>
        </li>
      ))}
    </ul>
  );
}

function AssignmentCreateForm({
  date,
  employees,
  categories,
  absentEmployeeIds,
}: {
  date: string;
  employees: EmployeeOption[];
  categories: CategoryOption[];
  absentEmployeeIds: Set<string>;
}) {
  return (
    <form action={createAssignmentAction} className="grid gap-4">
      <input type="hidden" name="date" value={date} />
      <Field label="Employee">
        <EmployeeSelect name="employeeId" employees={employees} absentEmployeeIds={absentEmployeeIds} required />
      </Field>
      <Field label="Category">
        <Select name="categoryId" required>
          <option value="">Choose category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Job title">
        <input name="title" required className="input" placeholder="Mow front nine greens" />
      </Field>
      <Field label="Location">
        <input name="location" className="input" placeholder="Front nine" />
      </Field>
      <Field label="Details">
        <textarea name="details" rows={4} className="input min-h-28" placeholder="Add route notes, cautions, or details." />
      </Field>
      <SubmitButton>
        <Plus className="mr-2 h-4 w-4" />
        Create job
      </SubmitButton>
    </form>
  );
}

function AssignmentList({
  data,
  employees,
  categories,
  absentEmployeeIds,
}: {
  data: DashboardData;
  employees: EmployeeOption[];
  categories: CategoryOption[];
  absentEmployeeIds: Set<string>;
}) {
  if (data.assignments.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/15 p-6 text-[#9a9d9d]">
        No jobs have been added for this date.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {data.assignments.map((assignment) => (
        <details key={assignment.id} className="rounded-md border border-white/10 bg-[#333e3d] p-4">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{assignment.employee.name}</p>
                <p className="text-sm text-[#9a9d9d]">
                  {assignment.title} / {assignment.category.name}
                </p>
                {absentEmployeeIds.has(assignment.employeeId) ? (
                  <p className="mt-2 text-sm font-semibold text-amber-100">This employee is marked absent for this day.</p>
                ) : null}
              </div>
              <span className="w-fit rounded border border-white/12 px-2 py-1 text-xs font-semibold">
                {STATUS_LABELS[assignment.status as AssignmentStatus] ?? assignment.status}
              </span>
            </div>
          </summary>

          <div className="mt-4 grid gap-4 border-t border-white/10 pt-4">
            <form action={updateAssignmentAction} className="grid gap-4">
              <input type="hidden" name="date" value={data.date} />
              <input type="hidden" name="id" value={assignment.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Employee">
                  <EmployeeSelect
                    name="employeeId"
                    employees={employees}
                    absentEmployeeIds={absentEmployeeIds}
                    defaultValue={assignment.employeeId}
                    required
                  />
                </Field>
                <Field label="Category">
                  <Select name="categoryId" defaultValue={assignment.categoryId} required>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Job title">
                <input name="title" defaultValue={assignment.title} required className="input" />
              </Field>
              <Field label="Location">
                <input name="location" defaultValue={assignment.location ?? ""} className="input" />
              </Field>
              <Field label="Details">
                <textarea name="details" rows={3} defaultValue={assignment.details ?? ""} className="input min-h-24" />
              </Field>
              <SubmitButton className="w-fit" variant="secondary">
                Save changes
              </SubmitButton>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {ASSIGNMENT_STATUSES.map((status) => (
                <form key={status} action={setAssignmentStatusAction}>
                  <input type="hidden" name="date" value={data.date} />
                  <input type="hidden" name="id" value={assignment.id} />
                  <input type="hidden" name="status" value={status} />
                  <SubmitButton
                    variant={status === assignment.status ? "primary" : "secondary"}
                    className="h-9 px-3 text-xs"
                    pendingText="Updating"
                  >
                    {STATUS_LABELS[status as AssignmentStatus]}
                  </SubmitButton>
                </form>
              ))}
              <form action={deleteAssignmentAction} className="ml-auto">
                <input type="hidden" name="date" value={data.date} />
                <input type="hidden" name="id" value={assignment.id} />
                <SubmitButton variant="danger" className="h-9 px-3 text-xs" pendingText="Deleting">
                  Delete
                </SubmitButton>
              </form>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function EmployeeManager({
  date,
  employees,
  categories,
}: {
  date: string;
  employees: EmployeeOption[];
  categories: CategoryOption[];
}) {
  return (
    <div className="grid gap-5">
      <form action={createEmployeeAction} className="grid gap-3">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="displayOrder" value={employees.length} />
        <Field label="Name">
          <input name="name" required className="input" placeholder="Employee name" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input name="title" className="input" placeholder="Crew lead" />
          </Field>
          <Field label="Radio">
            <input name="radio" className="input" placeholder="Radio number" />
          </Field>
        </div>
        <Field label="Default category">
          <Select name="categoryId">
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <SubmitButton className="w-fit">
          <Users className="mr-2 h-4 w-4" />
          Add employee
        </SubmitButton>
      </form>
      <EntityList>
        {employees.map((employee) => (
          <li key={employee.id} className="entity-row">
            <div>
              <p className="font-semibold">{employee.name}</p>
              <p className="text-sm text-[#9a9d9d]">
                {employee.title ?? "Turf crew"} / {employee.category?.name ?? "No category"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <form action={toggleEmployeeAction}>
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="id" value={employee.id} />
                <SubmitButton variant="secondary" className="h-8 px-3 text-xs" pendingText="Updating">
                  {employee.active ? "Deactivate" : "Activate"}
                </SubmitButton>
              </form>
              <form action={deleteEmployeeAction}>
                <input type="hidden" name="id" value={employee.id} />
                <SubmitButton
                  variant="danger"
                  className="h-8 px-3 text-xs"
                  pendingText="Deleting"
                  confirmMessage={`Permanently delete ${employee.name}? This also removes their assignments and absences.`}
                >
                  Delete
                </SubmitButton>
              </form>
            </div>
          </li>
        ))}
      </EntityList>
    </div>
  );
}

function CategoryManager({ date, categories }: { date: string; categories: CategoryOption[] }) {
  return (
    <div className="grid gap-5">
      <form action={createCategoryAction} className="grid gap-3">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="displayOrder" value={categories.length} />
        <Field label="Name">
          <input name="name" required className="input" placeholder="Greens" />
        </Field>
        <Field label="Description">
          <textarea name="description" rows={3} className="input min-h-24" placeholder="What belongs in this area." />
        </Field>
        <Field label="Accent">
          <input name="accentColor" type="color" defaultValue="#9a9d9d" className="input h-10 p-1" />
        </Field>
        <SubmitButton className="w-fit">
          <ClipboardList className="mr-2 h-4 w-4" />
          Add category
        </SubmitButton>
      </form>
      <EntityList>
        {categories.map((category) => (
          <li key={category.id} className="entity-row">
            <div>
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-[#9a9d9d]">{category.description ?? "No description"}</p>
            </div>
            <form action={toggleCategoryAction}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="id" value={category.id} />
              <SubmitButton variant="secondary" className="h-8 px-3 text-xs" pendingText="Updating">
                {category.active ? "Hide" : "Show"}
              </SubmitButton>
            </form>
          </li>
        ))}
      </EntityList>
    </div>
  );
}

function TemplateManager({
  date,
  templates,
  categories,
}: {
  date: string;
  templates: TemplateOption[];
  categories: CategoryOption[];
}) {
  return (
    <div className="grid gap-5">
      <form action={createTemplateAction} className="grid gap-3">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="displayOrder" value={templates.length} />
        <Field label="Title">
          <input name="title" required className="input" placeholder="Mow greens" />
        </Field>
        <Field label="Category">
          <Select name="categoryId" required>
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location">
          <input name="location" className="input" placeholder="Front nine" />
        </Field>
        <Field label="Details">
          <textarea name="details" rows={3} className="input min-h-24" placeholder="Default instructions." />
        </Field>
        <SubmitButton className="w-fit">Add saved job</SubmitButton>
      </form>
      <EntityList>
        {templates.map((template) => (
          <li key={template.id} className="entity-row">
            <div>
              <p className="font-semibold">{template.title}</p>
              <p className="text-sm text-[#9a9d9d]">{template.category.name}</p>
            </div>
            <form action={toggleTemplateAction}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="id" value={template.id} />
              <SubmitButton variant="secondary" className="h-8 px-3 text-xs" pendingText="Updating">
                {template.active ? "Disable" : "Enable"}
              </SubmitButton>
            </form>
          </li>
        ))}
      </EntityList>
    </div>
  );
}

function EntityList({ children }: { children: React.ReactNode }) {
  return <ul className="grid max-h-[460px] gap-2 overflow-auto pr-1">{children}</ul>;
}
