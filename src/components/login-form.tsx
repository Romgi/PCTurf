"use client";

import { useActionState } from "react";

import { loginAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[#d8dad7]">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="admin@example.com"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#d8dad7]">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="Password"
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-red-300/25 bg-red-950/25 px-3 py-2 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
      <SubmitButton pendingText="Signing in">Sign in</SubmitButton>
    </form>
  );
}
