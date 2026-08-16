"use client";

import { useId, useMemo, useState } from "react";
import { Check, ClipboardPenLine, X } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { saveEmployeeAssignmentAction } from "@/lib/actions";
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
  date,
  row,
}: {
  allSuggestions: string[];
  date: string;
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
    <form
      action={saveEmployeeAssignmentAction}
      className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
      onSubmit={() => setOpen(false)}
    >
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="employeeId" value={row.employee.id} />
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
          name="title"
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
                className="block w-full border-b border-white/8 px-3 py-2.5 text-left text-sm font-medium text-[#f4f1eb] last:border-b-0 hover:bg-white/[0.08] focus:bg-white/[0.08]"
                key={suggestion}
                onClick={() => {
                  setValue(suggestion);
                  setIsFiltering(false);
                  setOpen(false);
                }}
                aria-selected={suggestion.toLocaleLowerCase() === value.trim().toLocaleLowerCase()}
                role="option"
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <SubmitButton className="h-11 gap-2 px-3" pendingText="Saving">
          <Check className="h-4 w-4" />
          Save
        </SubmitButton>
        {row.assignmentTitle ? (
          <SubmitButton
            className="h-11 w-11 px-0"
            name="intent"
            pendingText="..."
            value="clear"
            variant="ghost"
          >
            <span className="sr-only">Clear assignment for {row.employee.name}</span>
            <X className="h-4 w-4" />
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}

export function AssignmentRoster({ allSuggestions, date, rows }: AssignmentRosterProps) {
  return (
    <div className="overflow-visible rounded-md border border-white/12">
      {rows.length > 0 ? (
        rows.map((row, index) => (
          <div
            className={cn(
              "grid gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(210px,0.42fr)_minmax(360px,1fr)] lg:items-center",
              index % 2 === 0 ? "bg-[#293231]" : "bg-[#303938]",
            )}
            key={row.employee.id}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#f4f1eb]">{row.employee.name}</p>
              {row.employee.title ? <p className="mt-0.5 truncate text-xs text-[#9a9d9d]">{row.employee.title}</p> : null}
            </div>
            <AssignmentInput allSuggestions={allSuggestions} date={date} row={row} />
          </div>
        ))
      ) : (
        <p className="bg-[#293231] px-4 py-8 text-center text-sm text-[#9a9d9d]">
          Add an active employee to begin assigning jobs.
        </p>
      )}
    </div>
  );
}
