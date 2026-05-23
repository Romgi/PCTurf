import Link from "next/link";

import { BoardClock } from "@/components/board-clock";
import { BrandLockup } from "@/components/brand-lockup";
import { FullscreenButton } from "@/components/fullscreen-button";
import { STATUS_LABELS, type AssignmentStatus } from "@/lib/constants";
import type { BoardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/ui";

type JobBoardProps = {
  data: BoardData;
  present?: boolean;
  showAdminLink?: boolean;
  showFullscreen?: boolean;
};

function statusLabel(status: string) {
  return STATUS_LABELS[status as AssignmentStatus] ?? status.replaceAll("_", " ");
}

function statusClass(status: string) {
  if (status === "DONE") return "border-emerald-200/20 bg-emerald-950/20 text-emerald-100";
  if (status === "BLOCKED") return "border-red-200/25 bg-red-950/25 text-red-100";
  if (status === "IN_PROGRESS") return "border-white/20 bg-white/[0.08] text-[#f4f1eb]";
  return "border-white/15 bg-transparent text-[#9a9d9d]";
}

export function JobBoard({ data, present = false, showAdminLink = false, showFullscreen = false }: JobBoardProps) {
  const hasAssignments = data.assignments.length > 0;

  if (present) {
    return <PresentBoard data={data} showFullscreen={showFullscreen} />;
  }

  return (
    <main
      className={cn(
        "min-h-screen bg-[#333e3d] text-[#f4f1eb]",
        present ? "px-8 py-7 lg:px-12" : "px-5 py-6 lg:px-8",
      )}
    >
      <header className="mx-auto flex max-w-[1800px] items-start justify-between gap-6 border-b border-white/12 pb-5">
        <BrandLockup />
        <div className="flex flex-col items-end gap-3 text-right">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#9a9d9d]">Daily Turf Board</p>
            <h1 className={cn("mt-1 font-semibold tracking-tight", present ? "text-4xl" : "text-3xl")}>
              {formatDisplayDate(data.date)}
            </h1>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {showFullscreen ? <FullscreenButton /> : null}
            {showAdminLink ? (
              <Link
                href="/admin/login"
                className="inline-flex h-10 items-center rounded-md border border-white/15 px-4 text-sm font-semibold text-[#f4f1eb] transition hover:bg-white/[0.06]"
              >
                Login
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 grid max-w-[1800px] gap-4 lg:grid-cols-[1fr_auto] lg:items-stretch">
        <WeatherPanel data={data} />
        <div className="rounded-md border border-white/12 bg-[#293231] px-5 py-4 text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">Current time</p>
          <p className="mt-1 text-3xl font-semibold">
            <BoardClock />
          </p>
        </div>
      </section>

      {data.plan.notes ? (
        <section className="mx-auto mt-4 max-w-[1800px]">
          <Notice label="Superintendent Notes" value={data.plan.notes} />
        </section>
      ) : null}

      <CategoryBoard data={data} />

      {data.absences.length > 0 ? (
        <section className="mx-auto mt-6 max-w-[1800px] rounded-md border border-white/12 bg-[#293231] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">Absent today</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.absences.map((absence) => (
              <span key={absence.id} className="rounded border border-white/12 bg-[#333e3d] px-3 py-2 text-sm">
                {absence.employee.name}
                {absence.reason ? ` - ${absence.reason}` : ""}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {!hasAssignments ? (
        <section className="mx-auto mt-6 max-w-[1800px] rounded-md border border-dashed border-white/15 p-8 text-center">
          <p className="text-lg font-semibold">No jobs have been posted for this date yet.</p>
          <p className="mt-2 text-[#9a9d9d]">The board will update automatically as assignments are added.</p>
        </section>
      ) : null}
    </main>
  );
}

function PresentBoard({ data, showFullscreen = false }: { data: BoardData; showFullscreen?: boolean }) {
  const report = data.weatherReport;
  const weatherDetails = [report.temperature, report.highLow, report.wind, report.precipitation].filter(Boolean);
  const totalEmployees = data.employeeAssignments.length;
  const columns = totalEmployees <= 10 ? 1 : totalEmployees <= 22 ? 2 : 3;
  const rowsPerColumn = Math.max(1, Math.ceil(totalEmployees / columns));
  const employeeColumns = Array.from({ length: columns }, (_, columnIndex) =>
    data.employeeAssignments.slice(columnIndex * rowsPerColumn, (columnIndex + 1) * rowsPerColumn),
  );

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#333e3d] px-5 py-4 text-[#f4f1eb]">
      <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/12 pb-3">
        <BrandLockup />
        <div className="flex items-start gap-4 text-right">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">Daily Turf Board</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{formatDisplayDate(data.date)}</h1>
          </div>
          {showFullscreen ? <FullscreenButton /> : null}
        </div>
      </header>

      <section className="my-3 grid shrink-0 gap-2 lg:grid-cols-[1fr_1.1fr_auto]">
        <div className="rounded-md border border-white/12 bg-[#293231] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9d9d]">{report.label}</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {report.summary}
            {weatherDetails.length > 0 ? ` / ${weatherDetails.join(" / ")}` : ""}
          </p>
        </div>
        <div className="rounded-md border border-white/12 bg-[#293231] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9d9d]">Notes</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {[data.plan.weather, data.plan.notes].filter(Boolean).join(" / ") || "No notes posted."}
          </p>
        </div>
        <div className="rounded-md border border-white/12 bg-[#293231] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9d9d]">Time</p>
          <p className="mt-1 text-sm font-semibold">
            <BoardClock />
          </p>
        </div>
      </section>

      <section
        className="grid min-h-0 flex-1 gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {employeeColumns.map((employeeColumn, columnIndex) => (
          <div
            key={columnIndex}
            className="grid min-h-0 gap-2"
            style={{ gridTemplateRows: `repeat(${rowsPerColumn}, minmax(0, 1fr))` }}
          >
            {employeeColumn.map(({ employee, assignments }) => (
              <article key={employee.id} className="grid min-h-0 grid-cols-[220px_1fr] overflow-hidden rounded-md border border-white/12 bg-[#293231]">
                <div className="min-w-0 border-r border-white/10 px-3 py-2">
                  <h2 className="truncate text-base font-semibold leading-tight">{employee.name}</h2>
                  <p className="mt-1 truncate text-xs text-[#9a9d9d]">{employee.title ?? employee.category?.name ?? "Turf crew"}</p>
                </div>
                <div className="min-w-0 px-3 py-2">
                  {assignments.length > 0 ? (
                    <div className="grid h-full min-h-0 gap-1">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-base font-semibold leading-tight">{assignment.title}</p>
                            <span
                              className={cn(
                                "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                statusClass(assignment.status),
                              )}
                            >
                              {statusLabel(assignment.status)}
                            </span>
                          </div>
                          {[assignment.location, assignment.details].filter(Boolean).length > 0 ? (
                            <p className="mt-1 truncate text-xs leading-tight text-[#9a9d9d]">
                              {[assignment.location, assignment.details].filter(Boolean).join(" / ")}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="truncate text-sm font-semibold text-[#9a9d9d]">No job posted.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>

      {data.absences.length > 0 ? (
        <section className="mt-2 shrink-0 truncate rounded-md border border-white/12 bg-[#293231] px-3 py-2 text-xs text-[#9a9d9d]">
          Absent today:{" "}
          <span className="text-[#f4f1eb]">
            {data.absences.map((absence) => absence.employee.name).join(", ")}
          </span>
        </section>
      ) : null}
    </main>
  );
}

function WeatherPanel({ data }: { data: BoardData }) {
  const report = data.weatherReport;
  const details = [report.temperature, report.highLow, report.wind, report.precipitation, report.humidity].filter(Boolean);

  return (
    <div className="rounded-md border border-white/12 bg-[#293231] px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">{report.label}</p>
          <p className="mt-2 text-2xl font-semibold">{report.summary}</p>
        </div>
        {report.unavailable ? null : (
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {details.map((detail) => (
              <span key={detail} className="rounded border border-white/12 bg-[#333e3d] px-3 py-2 text-sm text-[#d8dad7]">
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>
      {data.plan.weather ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9a9d9d]">Superintendent course note</p>
          <p className="mt-2 leading-7 text-[#f4f1eb]">{data.plan.weather}</p>
        </div>
      ) : null}
    </div>
  );
}

function CategoryBoard({ data }: { data: BoardData }) {
  return (
    <section className="mx-auto mt-6 grid max-w-[1800px] gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {data.categories.map((category) => (
        <article
          key={category.id}
          className="rounded-md border border-white/12 bg-[#293231] p-5"
          style={{ borderTopColor: category.accentColor, borderTopWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{category.name}</h2>
              {category.description ? <p className="mt-1 text-sm leading-6 text-[#9a9d9d]">{category.description}</p> : null}
            </div>
            <span className="rounded border border-white/12 px-2 py-1 text-xs font-semibold text-[#9a9d9d]">
              {category.assignments.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {category.assignments.length > 0 ? (
              category.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={cn("rounded-md border border-white/10 bg-[#333e3d] p-4", assignment.status === "DONE" && "opacity-65")}
                >
                  <p className="text-lg font-semibold">{assignment.employee.name}</p>
                  {assignment.employee.title ? <p className="text-sm text-[#9a9d9d]">{assignment.employee.title}</p> : null}
                  <p className="mt-3 text-base font-semibold text-[#f4f1eb]">{assignment.title}</p>
                  {assignment.location ? <p className="mt-1 text-sm text-[#9a9d9d]">{assignment.location}</p> : null}
                  {assignment.details ? <p className="mt-3 leading-6 text-[#d8dad7]">{assignment.details}</p> : null}
                  <span
                    className={cn(
                      "mt-4 inline-flex rounded border px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                      statusClass(assignment.status),
                    )}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-white/12 p-4 text-sm text-[#9a9d9d]">
                No jobs posted in this area.
              </p>
            )}
          </div>
        </article>
      ))}

      <article className="rounded-md border border-white/12 bg-[#293231] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Available / Unassigned</h2>
            <p className="mt-1 text-sm leading-6 text-[#9a9d9d]">Active, present employees without a posted job.</p>
          </div>
          <span className="rounded border border-white/12 px-2 py-1 text-xs font-semibold text-[#9a9d9d]">
            {data.unassignedEmployees.length}
          </span>
        </div>
        <div className="mt-5 grid gap-2">
          {data.unassignedEmployees.length > 0 ? (
            data.unassignedEmployees.map((employee) => (
              <div key={employee.id} className="rounded-md border border-white/10 bg-[#333e3d] px-4 py-3">
                <p className="font-semibold">{employee.name}</p>
                <p className="text-sm text-[#9a9d9d]">{employee.category?.name ?? employee.title ?? "Turf crew"}</p>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-white/12 p-4 text-sm text-[#9a9d9d]">
              Every active, present employee has at least one posted job.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

function Notice({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-[#293231] px-5 py-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[#9a9d9d]">{label}</p>
      <p className="mt-2 leading-7 text-[#f4f1eb]">{value}</p>
    </div>
  );
}
