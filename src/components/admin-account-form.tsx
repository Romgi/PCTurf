"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { createAdminAction, type ActionState } from "@/lib/actions";

const initialState: ActionState = {};

export function AdminAccountForm() {
  const [state, action] = useActionState(createAdminAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form action={action} className="grid gap-3" ref={formRef}>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Name
          <input autoComplete="name" className="input" maxLength={80} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Login email
          <input autoComplete="email" className="input" name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <input autoComplete="new-password" className="input" maxLength={128} minLength={12} name="password" required type="password" />
        </label>
      </div>
      <p className="text-xs text-[#9a9d9d]">Use at least 12 characters with uppercase, lowercase, and a number.</p>
      {state.error ? (
        <p className="rounded-md border border-red-300/25 bg-red-950/25 px-3 py-2 text-sm text-red-100">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-[#f4f1eb]">{state.success}</p>
      ) : null}
      <SubmitButton className="justify-self-start gap-2" pendingText="Adding admin">
        <UserPlus className="h-4 w-4" />
        Add administrator
      </SubmitButton>
    </form>
  );
}
