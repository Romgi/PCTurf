"use client";

import { useState } from "react";
import { Compass } from "lucide-react";

import { CutDirectionIndicator } from "@/components/cut-direction-indicator";
import { SubmitButton } from "@/components/submit-button";
import { updateDirectionOfCutAction } from "@/lib/actions";
import {
  CUT_DIRECTION_AREAS,
  CUT_DIRECTION_VALUES,
  getCutDirectionLabel,
  isCutDirection,
  type CutDirection,
  type CutDirectionField,
} from "@/lib/cut-directions";
import { cn } from "@/lib/ui";

type DirectionFormValues = Record<CutDirectionField, CutDirection | "">;

type DirectionOfCutProps = {
  date: string;
  initialDirections: Record<CutDirectionField, string | null>;
};

export function DirectionOfCut({ date, initialDirections }: DirectionOfCutProps) {
  const [directions, setDirections] = useState<DirectionFormValues>(() =>
    Object.fromEntries(
      CUT_DIRECTION_AREAS.map(({ key }) => [
        key,
        isCutDirection(initialDirections[key]) ? initialDirections[key] : "",
      ]),
    ) as DirectionFormValues,
  );

  return (
    <section className="overflow-hidden rounded-md border border-white/12 bg-[#293231]">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#9a9d9d]">
          <Compass className="h-4 w-4" />
          Direction of Cut
        </p>
        <p className="mt-2 text-sm text-[#d8dad7]">Set the mowing direction for each playing surface.</p>
      </div>

      <form action={updateDirectionOfCutAction}>
        <input name="date" type="hidden" value={date} />
        <div className="grid sm:grid-cols-2">
          {CUT_DIRECTION_AREAS.map((area, index) => (
            <div
              className={cn(
                "flex min-w-0 items-center gap-4 px-4 py-4",
                index < 3 && "border-b border-white/10",
                index === 2 && "sm:border-b-0",
                index % 2 === 0 && "sm:border-r sm:border-white/10",
              )}
              key={area.key}
            >
              <CutDirectionIndicator
                area={area.label}
                className="h-28 w-28 sm:h-32 sm:w-32"
                direction={directions[area.key]}
                id={`admin-${area.key}`}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-[#f4f1eb]">{area.label}</h3>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9d9d]">
                  Direction
                  <select
                    className="input mt-2 h-10 py-0 normal-case tracking-normal"
                    name={area.key}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDirections((current) => ({
                        ...current,
                        [area.key]: isCutDirection(value) ? value : "",
                      }));
                    }}
                    value={directions[area.key]}
                  >
                    <option value="">Select direction</option>
                    {CUT_DIRECTION_VALUES.map((direction) => (
                      <option key={direction} value={direction}>
                        {getCutDirectionLabel(direction)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-white/10 px-5 py-4">
          <SubmitButton pendingText="Saving directions">Save directions</SubmitButton>
        </div>
      </form>
    </section>
  );
}
