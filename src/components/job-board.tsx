import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BoardClock } from "@/components/board-clock";
import { BrandLockup } from "@/components/brand-lockup";
import { FullscreenButton } from "@/components/fullscreen-button";
import { WeatherIcon } from "@/components/weather-icon";
import type { BoardData } from "@/lib/data";
import { formatDisplayDate, formatTimeOfDay } from "@/lib/dates";
import { cn } from "@/lib/ui";

type JobBoardProps = {
  data: BoardData;
  showFullscreen?: boolean;
};

export function JobBoard({
  data,
  showFullscreen = false,
}: JobBoardProps) {
  return <PresentBoard data={data} showFullscreen={showFullscreen} />;
}

function PresentBoard({ data, showFullscreen }: { data: BoardData; showFullscreen: boolean }) {
  const report = data.weatherReport;
  const secondaryWeatherDetails = [report.highLow, report.wind, report.humidity].filter(Boolean);
  const totalEmployees = data.employeeAssignments.length;
  const columns = totalEmployees <= 12 ? 1 : totalEmployees <= 26 ? 2 : 3;
  const boardColumnClass = columns === 1 ? "lg:grid-cols-1" : columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  const rowsPerColumn = Math.max(1, Math.ceil(totalEmployees / columns));
  const employeeColumns = Array.from({ length: columns }, (_, columnIndex) =>
    data.employeeAssignments
      .slice(columnIndex * rowsPerColumn, (columnIndex + 1) * rowsPerColumn)
      .map((entry, rowIndex) => ({ entry, index: columnIndex * rowsPerColumn + rowIndex })),
  );

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto bg-[#333e3d] px-3 py-3 text-[#f4f1eb] sm:px-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-7 lg:py-5">
      <header className="flex shrink-0 flex-col gap-2 border-b border-white/12 pb-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <BrandLockup />
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left lg:w-auto lg:flex-nowrap lg:items-start lg:justify-end lg:gap-3 lg:text-right">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a9d9d]">Daily Turf Board</p>
            <h1 className="mt-0.5 text-base font-semibold sm:text-xl">{formatDisplayDate(data.date)}</h1>
          </div>
          {showFullscreen ? (
            <div className="hidden lg:block">
              <FullscreenButton className="h-9 px-3 text-xs" />
            </div>
          ) : null}
          <Link
            aria-label="Back to admin dashboard"
            className="nav-button h-9 gap-2 px-3 text-xs"
            href={`/admin?date=${data.date}`}
            title="Back to admin dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to admin dashboard</span>
          </Link>
        </div>
      </header>

      <section className="my-2 grid shrink-0 grid-cols-1 gap-1.5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto]">
        <div className="flex min-h-20 min-w-0 items-center gap-3 rounded-md border border-white/12 bg-[#293231] px-3 py-3 sm:gap-4 sm:px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/12 bg-[#333e3d] sm:h-12 sm:w-12">
            <WeatherIcon className="h-7 w-7 sm:h-8 sm:w-8" summary={report.summary} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">{report.label}</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="break-words text-lg font-semibold leading-tight sm:text-xl lg:shrink-0 lg:truncate lg:leading-none">{report.summary}</p>
              {report.temperature ? <p className="text-lg font-semibold leading-none">{report.temperature}</p> : null}
              {report.precipitation ? <p className="text-lg font-semibold leading-none">{report.precipitation}</p> : null}
            </div>
            {secondaryWeatherDetails.length > 0 ? (
              <p className="mt-1.5 break-words text-[10px] font-medium text-[#9a9d9d] lg:truncate">{secondaryWeatherDetails.join(" / ")}</p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center rounded-md border border-white/12 bg-[#293231] px-3 py-3 sm:px-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Notes</p>
          <p className="mt-1.5 break-words text-sm font-semibold lg:truncate">
            {[data.plan.weather, data.plan.notes].filter(Boolean).join(" / ") || "No notes posted"}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-md border border-white/12 bg-[#293231] px-3 py-3 text-left sm:px-4 lg:text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Time</p>
          <p className="mt-1 whitespace-nowrap text-2xl font-semibold"><BoardClock /></p>
          {data.plan.startTime ? (
            <p className="mt-1 whitespace-nowrap text-xs font-medium text-[#d8dad7]">
              Start {formatTimeOfDay(data.plan.startTime)}
            </p>
          ) : null}
        </div>
      </section>

      {totalEmployees > 0 ? (
        <section
          className={cn("grid flex-none grid-cols-1 gap-1.5 lg:min-h-0 lg:flex-1", boardColumnClass)}
        >
          {employeeColumns.map((employeeColumn, columnIndex) => (
            <div
              className="grid auto-rows-auto gap-px overflow-visible rounded border border-white/12 bg-white/10 lg:min-h-0 lg:auto-rows-fr lg:overflow-hidden"
              key={columnIndex}
            >
              {employeeColumn.map(({ entry: { employee, assignment }, index }) => (
                <article
                  className={cn(
                    "grid min-h-12 grid-cols-[minmax(0,42%)_minmax(0,1fr)] overflow-visible lg:min-h-0 lg:grid-cols-[minmax(130px,34%)_minmax(0,1fr)] lg:overflow-hidden",
                    index % 2 === 0 ? "bg-[#293231]" : "bg-[#303938]",
                  )}
                  key={employee.id}
                >
                  <div className="flex min-w-0 flex-col justify-center border-r border-white/10 px-2.5 py-1">
                    <h2 className="break-words text-[15px] font-semibold leading-tight lg:truncate">{employee.name}</h2>
                    {employee.title ? <p className="mt-0.5 break-words text-[10px] leading-tight text-[#9a9d9d] lg:truncate">{employee.title}</p> : null}
                  </div>
                  <div className="flex min-w-0 items-center px-2.5 py-1">
                    <p className={cn("break-words font-sans text-[15px] font-normal leading-tight lg:truncate", !assignment && "text-[#9a9d9d]")}>
                      {assignment?.title || "Unassigned"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-white/15 text-[#9a9d9d]">
          No active employees are listed.
        </section>
      )}
    </main>
  );
}
