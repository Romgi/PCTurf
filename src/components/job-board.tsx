import { BoardClock } from "@/components/board-clock";
import { BrandLockup } from "@/components/brand-lockup";
import { FullscreenButton } from "@/components/fullscreen-button";
import { WeatherIcon } from "@/components/weather-icon";
import type { BoardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
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
  const rowsPerColumn = Math.max(1, Math.ceil(totalEmployees / columns));
  const employeeColumns = Array.from({ length: columns }, (_, columnIndex) =>
    data.employeeAssignments
      .slice(columnIndex * rowsPerColumn, (columnIndex + 1) * rowsPerColumn)
      .map((entry, rowIndex) => ({ entry, index: columnIndex * rowsPerColumn + rowIndex })),
  );

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#333e3d] px-4 py-3 text-[#f4f1eb]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/12 pb-2">
        <BrandLockup />
        <div className="flex items-start gap-3 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a9d9d]">Daily Turf Board</p>
            <h1 className="mt-0.5 text-xl font-semibold">{formatDisplayDate(data.date)}</h1>
          </div>
          {showFullscreen ? <FullscreenButton className="h-9 px-3 text-xs" /> : null}
        </div>
      </header>

      <section className="my-2 grid shrink-0 grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto] gap-1.5">
        <div className="flex min-h-20 min-w-0 items-center gap-4 rounded-md border border-white/12 bg-[#293231] px-4 py-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/12 bg-[#333e3d]">
            <WeatherIcon className="h-8 w-8" summary={report.summary} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">{report.label}</p>
            <div className="mt-1 flex min-w-0 items-baseline gap-3">
              <p className="shrink-0 truncate text-xl font-semibold leading-none">{report.summary}</p>
              {report.temperature ? <p className="truncate text-lg font-semibold leading-none">{report.temperature}</p> : null}
              {report.precipitation ? <p className="truncate text-lg font-semibold leading-none">{report.precipitation}</p> : null}
            </div>
            {secondaryWeatherDetails.length > 0 ? (
              <p className="mt-1.5 truncate text-[10px] font-medium text-[#9a9d9d]">{secondaryWeatherDetails.join(" / ")}</p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center rounded-md border border-white/12 bg-[#293231] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Notes</p>
          <p className="mt-1.5 truncate text-sm font-semibold">
            {[data.plan.weather, data.plan.notes].filter(Boolean).join(" / ") || "No notes posted"}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-md border border-white/12 bg-[#293231] px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a9d9d]">Time</p>
          <p className="mt-1 whitespace-nowrap text-2xl font-semibold"><BoardClock /></p>
        </div>
      </section>

      {totalEmployees > 0 ? (
        <section
          className="grid min-h-0 flex-1 gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {employeeColumns.map((employeeColumn, columnIndex) => (
            <div
              className="grid min-h-0 overflow-hidden rounded border border-white/12 bg-white/10 gap-px"
              key={columnIndex}
              style={{ gridTemplateRows: `repeat(${rowsPerColumn}, minmax(0, 1fr))` }}
            >
              {employeeColumn.map(({ entry: { employee, assignment }, index }) => (
                <article
                  className={cn(
                    "grid min-h-0 grid-cols-[minmax(130px,34%)_minmax(0,1fr)] overflow-hidden",
                    index % 2 === 0 ? "bg-[#293231]" : "bg-[#303938]",
                  )}
                  key={employee.id}
                >
                  <div className="flex min-w-0 flex-col justify-center border-r border-white/10 px-2.5 py-1">
                    <h2 className="truncate text-sm font-semibold leading-tight">{employee.name}</h2>
                    {employee.title ? <p className="mt-0.5 truncate text-[10px] leading-tight text-[#9a9d9d]">{employee.title}</p> : null}
                  </div>
                  <div className="flex min-w-0 items-center px-2.5 py-1">
                    <p className={cn("truncate text-sm font-semibold leading-tight", !assignment && "text-[#9a9d9d]")}>
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
