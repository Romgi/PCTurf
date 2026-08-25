"use client";

import { useId, useState } from "react";
import { Compass, Rabbit } from "lucide-react";

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

type DirectionConfig = {
  angle: number;
  labels: Array<{ text: string; x: number; y: number }>;
};

const directionConfigs: Record<Exclude<CutDirection, "quickest">, DirectionConfig> = {
  "8-2": {
    angle: -45,
    labels: [
      { text: "8", x: 25, y: 98 },
      { text: "2", x: 95, y: 29 },
    ],
  },
  "10-4": {
    angle: 45,
    labels: [
      { text: "10", x: 25, y: 29 },
      { text: "4", x: 95, y: 98 },
    ],
  },
  "12-6": {
    angle: 90,
    labels: [
      { text: "12", x: 60, y: 17 },
      { text: "6", x: 60, y: 111 },
    ],
  },
  "9-3": {
    angle: 0,
    labels: [
      { text: "9", x: 13, y: 64 },
      { text: "3", x: 107, y: 64 },
    ],
  },
};

const stripeOffsets = [33, 42, 51, 60, 69, 78, 87];

function DirectionIndicator({ area, direction }: { area: string; direction: CutDirection | "" }) {
  const clipId = `cut-direction-${useId().replaceAll(":", "")}`;
  const config = direction && direction !== "quickest" ? directionConfigs[direction] : null;
  const directionLabel = direction ? getCutDirectionLabel(direction) : "not set";

  return (
    <figure
      aria-label={`${area} direction of cut: ${directionLabel}`}
      className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32"
      role="img"
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 120 120">
        <defs>
          <clipPath id={clipId}>
            <circle cx="60" cy="60" r="47" />
          </clipPath>
        </defs>

        <circle cx="60" cy="60" fill="#333e3d" r="47" stroke="rgb(255 255 255 / 0.24)" strokeWidth="2" />

        {config ? (
          <g clipPath={`url(#${clipId})`} transform={`rotate(${config.angle} 60 60)`}>
            {stripeOffsets.map((offset) => (
              <line
                key={offset}
                stroke="rgb(154 157 157 / 0.5)"
                strokeWidth="1.5"
                x1="12"
                x2="108"
                y1={offset}
                y2={offset}
              />
            ))}
          </g>
        ) : null}

        {config ? (
          <>
            <g fill="#ef4444" stroke="#ef4444" transform={`rotate(${config.angle} 60 60)`}>
              <line strokeWidth="5" x1="31" x2="89" y1="60" y2="60" />
              <path d="M 21 60 L 35 51 L 35 69 Z" stroke="none" />
              <path d="M 99 60 L 85 51 L 85 69 Z" stroke="none" />
            </g>
            {config.labels.map((label) => (
              <text
                fill="#f4f1eb"
                fontSize="10"
                fontWeight="700"
                key={label.text}
                textAnchor="middle"
                x={label.x}
                y={label.y}
              >
                {label.text}
              </text>
            ))}
          </>
        ) : null}
      </svg>

      {direction === "quickest" ? (
        <Rabbit
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-[#ef4444]"
          strokeWidth={2.5}
        />
      ) : null}

      {!direction ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9d9d]">
          Select
        </span>
      ) : null}
    </figure>
  );
}

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
              <DirectionIndicator area={area.label} direction={directions[area.key]} />
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
