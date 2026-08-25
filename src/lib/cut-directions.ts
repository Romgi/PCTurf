export const CUT_DIRECTION_VALUES = ["8-2", "10-4", "12-6", "9-3", "quickest"] as const;

export type CutDirection = (typeof CUT_DIRECTION_VALUES)[number];

export const CUT_DIRECTION_AREAS = [
  { key: "greensCutDirection", label: "Greens" },
  { key: "approachesCutDirection", label: "Approaches" },
  { key: "teesCutDirection", label: "Tees" },
  { key: "fairwaysCutDirection", label: "Fairways" },
] as const;

export type CutDirectionField = (typeof CUT_DIRECTION_AREAS)[number]["key"];

export function isCutDirection(value: unknown): value is CutDirection {
  return CUT_DIRECTION_VALUES.includes(value as CutDirection);
}

export function getCutDirectionLabel(direction: CutDirection) {
  return direction === "quickest" ? "Quickest" : direction;
}
