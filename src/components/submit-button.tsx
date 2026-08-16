"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/ui";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  name?: string;
  pendingText?: string;
  value?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-[#f4f1eb] text-[#202827] hover:bg-white",
  secondary: "border border-white/15 bg-white/[0.04] text-[#f4f1eb] hover:bg-white/[0.08]",
  danger: "border border-red-300/30 bg-red-950/30 text-red-100 hover:bg-red-950/50",
  ghost: "text-[#f4f1eb] hover:bg-white/[0.06]",
};

export function SubmitButton({
  children,
  className,
  confirmMessage,
  name,
  pendingText = "Saving",
  value,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      name={name}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        className,
      )}
      value={value}
    >
      {pending ? pendingText : children}
    </button>
  );
}
