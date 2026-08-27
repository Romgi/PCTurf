import { Rabbit } from "lucide-react";

import { getCutDirectionLabel, type CutDirection } from "@/lib/cut-directions";
import { cn } from "@/lib/ui";

type DirectionConfig = {
  angle: number;
  labels: Array<{ text: string; x: number; y: number }>;
};

type CutDirectionIndicatorProps = {
  area: string;
  className?: string;
  direction: CutDirection | "";
  id: string;
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

export function CutDirectionIndicator({ area, className, direction, id }: CutDirectionIndicatorProps) {
  const clipId = `cut-direction-${id.replace(/[^a-z0-9-]/gi, "-")}`;
  const config = direction && direction !== "quickest" ? directionConfigs[direction] : null;
  const directionLabel = direction ? getCutDirectionLabel(direction) : "not set";

  return (
    <figure
      aria-label={`${area} direction of cut: ${directionLabel}`}
      className={cn("relative shrink-0", className)}
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
          className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 text-[#ef4444]"
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
