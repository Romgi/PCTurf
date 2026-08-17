"use client";

import { useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Users } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import {
  createEmployeeAction,
  deleteEmployeeAction,
  reorderEmployeesAction,
  toggleEmployeeAction,
  updateEmployeeAction,
} from "@/lib/actions";
import { cn } from "@/lib/ui";

type Employee = {
  active: boolean;
  displayOrder: number;
  id: string;
  name: string;
  title: string | null;
};

function SortableEmployee({
  disabled,
  employee,
  index,
}: {
  disabled: boolean;
  employee: Employee;
  index: number;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    disabled,
    id: employee.id,
  });

  return (
    <div
      className={cn(
        "flex rounded-md border border-white/10",
        index % 2 === 0 ? "bg-[#333e3d]" : "bg-[#303938]",
        isDragging && "relative z-20 opacity-75 shadow-2xl",
      )}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${employee.name}`}
        className="flex w-11 shrink-0 touch-none items-center justify-center border-r border-white/10 text-[#9a9d9d] hover:bg-white/[0.05] hover:text-[#f4f1eb] focus:text-[#f4f1eb] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        title="Drag to reorder"
        type="button"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <details className="min-w-0 flex-1">
        <summary className="flex list-none items-center justify-between gap-4 px-4 py-3">
          <span className="min-w-0">
            <span className="block truncate font-semibold">{employee.name}</span>
            {employee.title ? <span className="mt-0.5 block truncate text-xs text-[#9a9d9d]">{employee.title}</span> : null}
          </span>
          <span className={cn("text-xs font-semibold uppercase tracking-[0.14em]", employee.active ? "text-[#d8dad7]" : "text-[#9a9d9d]")}>
            {employee.active ? "Active" : "Inactive"}
          </span>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={updateEmployeeAction} className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
            <input name="id" type="hidden" value={employee.id} />
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a9d9d]">
              Name
              <input className="input normal-case tracking-normal" defaultValue={employee.name} name="name" required />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a9d9d]">
              Title
              <input className="input normal-case tracking-normal" defaultValue={employee.title ?? ""} name="title" />
            </label>
            <SubmitButton variant="secondary">Save</SubmitButton>
          </form>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <form action={toggleEmployeeAction}>
              <input name="id" type="hidden" value={employee.id} />
              <SubmitButton variant="secondary">{employee.active ? "Deactivate" : "Reactivate"}</SubmitButton>
            </form>
            <form action={deleteEmployeeAction}>
              <input name="id" type="hidden" value={employee.id} />
              <SubmitButton
                confirmMessage={`Permanently delete ${employee.name} and all of their assignment history? This cannot be undone.`}
                variant="danger"
              >
                Delete permanently
              </SubmitButton>
            </form>
          </div>
        </div>
      </details>
    </div>
  );
}

export function EmployeeManager({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || isPending) return;

    const previousEmployees = employees;
    const oldIndex = employees.findIndex((employee) => employee.id === active.id);
    const newIndex = employees.findIndex((employee) => employee.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedEmployees = arrayMove(employees, oldIndex, newIndex);
    setEmployees(reorderedEmployees);
    setError(undefined);

    startTransition(async () => {
      try {
        await reorderEmployeesAction(reorderedEmployees.map((employee) => employee.id));
      } catch {
        setEmployees(previousEmployees);
        setError("Employee order could not be saved. Refresh and try again.");
      }
    });
  }

  return (
    <section className="mx-auto mt-5 max-w-[1680px] rounded-md border border-white/12 bg-[#293231] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[#9a9d9d]" />
          <div>
            <h2 className="text-xl font-semibold">Employees</h2>
            <p className="text-sm text-[#9a9d9d]">Drag employees into board order, or open a row to edit its details.</p>
          </div>
        </div>
        {isPending ? <p className="text-sm font-semibold text-[#d8dad7]">Saving order...</p> : null}
      </div>

      <form action={createEmployeeAction} className="mt-5 grid gap-3 border-y border-white/10 py-5 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          Name
          <input className="input" name="name" placeholder="Employee name" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Title
          <input className="input" name="title" placeholder="(optional)" />
        </label>
        <SubmitButton className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </SubmitButton>
      </form>

      {error ? <p className="mt-4 rounded-md border border-red-300/25 bg-red-950/25 px-3 py-2 text-sm text-red-100">{error}</p> : null}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={employees.map((employee) => employee.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 grid gap-2">
            {employees.map((employee, index) => (
              <SortableEmployee disabled={isPending} employee={employee} index={index} key={employee.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
