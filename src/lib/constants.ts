export const ASSIGNMENT_STATUSES = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED"] as const;
export const ASSIGNMENT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type AssignmentPriority = (typeof ASSIGNMENT_PRIORITIES)[number];

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const PRIORITY_LABELS: Record<AssignmentPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export function isAssignmentStatus(value: string): value is AssignmentStatus {
  return ASSIGNMENT_STATUSES.includes(value as AssignmentStatus);
}

export function isAssignmentPriority(value: string): value is AssignmentPriority {
  return ASSIGNMENT_PRIORITIES.includes(value as AssignmentPriority);
}
