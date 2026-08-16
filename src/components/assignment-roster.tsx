"use client";

import { useId, useMemo, useState } from "react";
import { ClipboardPenLine, Save, Trash2 } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { saveAllAssignmentsAction } from "@/lib/actions";
import { cn } from "@/lib/ui";

type AssignmentRow = {
  employee: {
    id: string;
    name: string;
    title: string | null;
  };
  assignmentTitle: string;
  commonJobs: string[];
};

type AssignmentRosterProps = {
  allSuggestions: string[];
  date: string;
  rows: AssignmentRow[];
};

function uniqueSuggestions(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function AssignmentInput({
  allSuggestions,
  row,
}: {
  allSuggestions: string[];
  row: AssignmentRow;
}) {
  const [value, setValue] = useState(row.assignmentTitle);
  const [open, setOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const listboxId = useId();
  const suggestions = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();

    if (!isFiltering || !query) {
      const initial = row.commonJobs.length > 0
        ? [...row.commonJobs, "Absent"]
        : ["Absent", ...allSuggestions];
      return uniqueSuggestions(initial).slice(0, 6);
    }

    return uniqueSuggestions(allSuggestions)
      .filter((suggestion) => suggestion.toLocaleLowerCase().includes(query))
      .slice(0, 8);
  }, [allSuggestions, isFiltering, row.commonJobs, value]);

  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <ClipboardPenLine
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#9a9d9d]"
      />
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        autoComplete="off"
        className="input h-11 pl-9"
        name={`assignment:${row.employee.id}`}
        onChange={(event) => {
          setValue(event.target.value);
          setIsFiltering(true);
          setOpen(true);
        }}
        onFocus={() => {
          setIsFiltering(false);
          setOpen(true);
        }}
        placeholder="Type or choose a job"
        role="combobox"
        value={value}
      />
      {open && suggestions.length > 0 ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-md border border-white/15 bg-[#202827] shadow-2xl"
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((suggestion) => (
            <button
              aria-selected={suggestion.toLocaleLowerCase() === value.trim().toLocaleLowerCase()}
              className="block w-full border-b border-white/8 px-3 py-2.5 text-left text-sm font-medium text-[#f4f1eb] last:border-b-0 hover:bg-white/[0.08] focus:bg-white/[0.08]"
              key={suggestion}
              onClick={() => {
                setValue(suggestion);
                setIsFiltering(false);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AssignmentRoster({ allSuggestions, date, rows }: AssignmentRosterProps) {
  return (
    <form action={saveAllAssignmentsAction} className="overflow-visible rounded-md border border-white/12">
      <input name="date" type="hidden" value={date} />
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-white/12 bg-[#202827] px-4 py-3">
        <SubmitButton className="gap-2" name="intent" pendingText="Saving all" value="save">
          <Save className="h-4 w-4" />
          Save all
        </SubmitButton>
        <SubmitButton
          className="gap-2"
          confirmMessage={`Clear every assignment for ${date}?`}
          name="intent"
          pendingText="Clearing"
          value="clear"
          variant="danger"
        >
          <Trash2 className="h-4 w-4" />
          Clear all
        </SubmitButton>
      </div>
      {rows.length > 0 ? (
        rows.map((row, index) => (
          <div
            className={cn(
              "grid gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(210px,0.42fr)_minmax(360px,1fr)] lg:items-center",
              index % 2 === 0 ? "bg-[#293231]" : "bg-[#303938]",
            )}
            key={row.employee.id}
          >
            <input name="employeeId" type="hidden" value={row.employee.id} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#f4f1eb]">{row.employee.name}</p>
              {row.employee.title ? <p className="mt-0.5 truncate text-xs text-[#9a9d9d]">{row.employee.title}</p> : null}
            </div>
            <AssignmentInput
              allSuggestions={allSuggestions}
              key={`${row.employee.id}:${row.assignmentTitle}`}
              row={row}
            />
          </div>
        ))
      ) : (
        <p className="bg-[#293231] px-4 py-8 text-center text-sm text-[#9a9d9d]">
          Add an active employee to begin assigning jobs.
        </p>
      )}
    </form>
  );
}
